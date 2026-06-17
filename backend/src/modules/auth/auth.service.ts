import { randomBytes } from 'crypto';

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { LOCKOUT_MS, MAX_FAILED_LOGINS } from '../../common/constants/security';
import { TokenService } from './token.service';
import { GoogleProfile } from './strategies/google.strategy';
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

    const user = await this.provisionUser({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
    });

    const issued = await this.tokens.issueTokens(user);
    return { ...issued, user: this.toPublicUser(user) };
  }

  /**
   * สร้าง user + personal workspace + membership(owner) + PRO trial 14 วัน (atomic)
   * ใช้ร่วมกันทั้ง register (email/password) และ Google OAuth (ไม่มี password)
   */
  private async provisionUser(
    data: Pick<Prisma.UserCreateInput, 'name' | 'email'> &
      Partial<
        Pick<
          Prisma.UserCreateInput,
          'password' | 'googleId' | 'avatarUrl' | 'emailVerifiedAt'
        >
      >,
  ): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data });

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
  }

  // ── GOOGLE OAUTH ──────────────────────────────────────────
  /** หา/ผูก/สร้าง user จาก Google profile แล้วออก token (เหมือน login) */
  async loginWithGoogle(profile: GoogleProfile): Promise<AuthResult> {
    // 1) เคยผูก Google ไว้แล้ว → ใช้บัญชีนั้น
    let user = await this.prisma.user.findFirst({
      where: { googleId: profile.googleId, deletedAt: null },
    });

    // 2) ยังไม่ผูก แต่มีบัญชี email เดิม → link googleId เข้าบัญชีเดิม
    if (!user) {
      const byEmail = await this.prisma.user.findFirst({
        where: { email: profile.email, deletedAt: null },
      });
      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl,
            emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
          },
        });
      }
    }

    // 3) ไม่มีเลย → สร้างใหม่ (ไม่มี password) + workspace + trial
    if (!user) {
      user = await this.provisionUser({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
        emailVerifiedAt: new Date(), // Google ยืนยันอีเมลให้แล้ว
      });
    }

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

    // ถูกล็อกชั่วคราวจากการเดารหัสผิดซ้ำ — ตอบ generic ไม่เปิดเผยสถานะบัญชี
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await argon2.hash('dummy-timing-guard');
      throw invalid();
    }

    // บัญชีสมัครผ่าน Google (ไม่มีรหัสผ่าน) → ให้ login ด้วย Google เท่านั้น
    if (!user.password) {
      await argon2.hash('dummy-timing-guard');
      throw invalid();
    }

    const ok = await argon2.verify(user.password, dto.password);
    if (!ok) {
      await this.registerFailedLogin(user.id, user.failedLoginCount);
      throw invalid();
    }

    await this.clearFailedLogins(user);
    const issued = await this.tokens.issueTokens(user);
    return { ...issued, user: this.toPublicUser(user) };
  }

  /** นับ login ที่ผิด — ถึงเกณฑ์ → ล็อกบัญชีชั่วคราว แล้วรีเซ็ตตัวนับ */
  private async registerFailedLogin(
    userId: bigint,
    current: number,
  ): Promise<void> {
    const next = current + 1;
    const data =
      next >= MAX_FAILED_LOGINS
        ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) }
        : { failedLoginCount: next };
    await this.prisma.user.update({ where: { id: userId }, data });
  }

  /** login สำเร็จ → ล้างตัวนับ/สถานะล็อก (เขียนเฉพาะเมื่อจำเป็น) */
  private async clearFailedLogins(user: User): Promise<void> {
    if (user.failedLoginCount === 0 && !user.lockedUntil) return;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
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

    // dev: log ลิงก์รีเซ็ต (prod: ส่งอีเมลจริง — ห้าม log token ใน production)
    if (this.config.get<string>('app.env') !== 'production') {
      const url = `${this.config.get('app.frontendUrl')}/reset-password?email=${encodeURIComponent(
        dto.email,
      )}&token=${rawToken}`;
      this.logger.log(`🔑 Password reset link: ${url}`);
    }
    // TODO(prod): ส่งอีเมลรีเซ็ตจริงผ่าน mail provider ที่นี่

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
