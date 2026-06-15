import { randomBytes } from 'crypto';

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface PublicUser {
  publicId: string;
  name: string;
  email: string;
  systemRole: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string; // raw — controller เอาไปตั้ง httpOnly cookie
  user: PublicUser;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 ชม.

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  private toPublicUser(user: User): PublicUser {
    return {
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole,
    };
  }

  // ── REGISTER ──────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    // user + personal workspace + membership(owner) + free subscription (atomic)
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: dto.name, email: dto.email, password: passwordHash },
      });

      const workspace = await tx.workspace.create({
        data: {
          ownerId: created.id,
          name: 'ส่วนตัว',
          type: 'personal',
        },
      });

      await tx.membership.create({
        data: {
          workspaceId: workspace.id,
          userId: created.id,
          role: 'owner',
        },
      });

      await tx.user.update({
        where: { id: created.id },
        data: { lastActiveWorkspaceId: workspace.id },
      });

      // ผู้ใช้ใหม่ได้ PRO trial 14 วัน (หมดอายุ → downgrade free อัตโนมัติ)
      const proPlan = await tx.plan.findUnique({ where: { code: 'pro' } });
      if (proPlan) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        await tx.subscription.create({
          data: {
            workspaceId: workspace.id,
            planId: proPlan.id,
            status: 'trialing',
            startedAt: now,
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
          },
        });
      } else {
        this.logger.warn('Pro plan ไม่พบ — ข้ามการสร้าง trial (รัน seed?)');
      }

      return created;
    });

    const issued = await this.tokens.issueTokens(user);
    return { ...issued, user: this.toPublicUser(user) };
  }

  // ── LOGIN ─────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    // generic error — ไม่บอกว่า email หรือ password ผิด
    const invalid = () =>
      new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    if (!user) {
      // verify dummy กัน timing attack (เวลาตอบใกล้เคียงกรณีมี user)
      await argon2.hash('dummy-timing-guard');
      throw invalid();
    }

    const ok = await argon2.verify(user.password, dto.password);
    if (!ok) throw invalid();

    const issued = await this.tokens.issueTokens(user);
    return { ...issued, user: this.toPublicUser(user) };
  }

  // ── ADMIN LOGIN (เฉพาะ system_role = admin) ───────────────
  async adminLogin(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    const invalid = () =>
      new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    if (!user) {
      await argon2.hash('dummy-timing-guard');
      throw invalid();
    }
    const ok = await argon2.verify(user.password, dto.password);
    if (!ok) throw invalid();

    // ผู้เช่า (user) เข้าประตูแอดมินไม่ได้
    if (user.systemRole !== 'admin') {
      throw new ForbiddenException('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล');
    }

    const issued = await this.tokens.issueTokens(user);
    return { ...issued, user: this.toPublicUser(user) };
  }

  // ── REFRESH (rotation + reuse detection) ──────────────────
  async refresh(rawToken: string | undefined): Promise<AuthResult> {
    if (!rawToken) throw new UnauthorizedException('ไม่พบ refresh token');

    let payload: { sub: string };
    try {
      payload = await this.tokens.verifyRefresh(rawToken);
    } catch {
      throw new UnauthorizedException('refresh token ไม่ถูกต้องหรือหมดอายุ');
    }

    const tokenHash = this.tokens.hash(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    // ลายเซ็นถูกแต่ไม่อยู่ใน DB = ถูกหมุนไปแล้ว/ใช้ซ้ำ → เพิกถอนทั้งหมด
    if (!stored || stored.revokedAt) {
      const user = await this.prisma.user.findFirst({
        where: { publicId: payload.sub },
        select: { id: true },
      });
      if (user) await this.tokens.revokeAllForUser(user.id);
      throw new UnauthorizedException('ตรวจพบการใช้ refresh token ซ้ำ');
    }

    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('refresh token หมดอายุ');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: stored.userId, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException('ไม่พบผู้ใช้');

    // rotation: ลบ token เก่า แล้วออกใหม่
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const issued = await this.tokens.issueTokens(user);
    return { ...issued, user: this.toPublicUser(user) };
  }

  // ── LOGOUT ────────────────────────────────────────────────
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = this.tokens.hash(rawToken);
    await this.prisma.refreshToken
      .delete({ where: { tokenHash } })
      .catch(() => undefined); // ไม่มีก็ไม่เป็นไร
  }

  // ── FORGOT PASSWORD ───────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const generic = {
      message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตให้แล้ว',
    };

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true },
    });
    if (!user) return generic; // ไม่เปิดเผยว่ามี email จริงไหม

    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        email: dto.email,
        tokenHash: this.tokens.hash(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    // dev: log ลิงก์รีเซ็ต (prod: ส่งอีเมลจริง)
    const url = `${this.config.get('app.frontendUrl')}/reset-password?email=${encodeURIComponent(
      dto.email,
    )}&token=${rawToken}`;
    this.logger.log(`🔑 Password reset link: ${url}`);

    return generic;
  }

  // ── RESET PASSWORD ────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.tokens.hash(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.email !== dto.email || record.expiresAt < new Date()) {
      throw new UnauthorizedException('ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException('ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ');

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { email: dto.email } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่' };
  }
}
