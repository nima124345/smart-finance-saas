import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  LOCKOUT_MS,
  MAX_FAILED_LOGINS,
} from '../../../common/constants/security';
import { AuditService } from '../audit.service';
import { AdminTokenService, AdminTokens } from './admin-token.service';

export interface AdminAuthResult extends AdminTokens {
  admin: { publicId: string; name: string; email: string };
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: AdminTokenService,
    private readonly audit: AuditService,
  ) {}

  private toAdmin(u: User) {
    return { publicId: u.publicId, name: u.name, email: u.email };
  }

  /** login — เฉพาะ system_role=admin + ไม่ถูกระงับ; user ปกติ → 403 */
  async login(
    email: string,
    pass: string,
    ip?: string,
  ): Promise<AdminAuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    const invalid = () =>
      new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    if (!user) {
      await argon2.hash('dummy-timing-guard');
      throw invalid();
    }

    // brute-force lockout (admin = high-value) — ตอบ generic
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await argon2.hash('dummy-timing-guard');
      throw invalid();
    }

    // บัญชี Google (ไม่มีรหัสผ่าน) เข้า admin portal ด้วยรหัสผ่านไม่ได้
    if (!user.password) {
      await argon2.hash('dummy-timing-guard');
      throw invalid();
    }

    const ok = await argon2.verify(user.password, pass);
    if (!ok) {
      const next = user.failedLoginCount + 1;
      const locked = next >= MAX_FAILED_LOGINS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: locked
          ? {
              failedLoginCount: 0,
              lockedUntil: new Date(Date.now() + LOCKOUT_MS),
            }
          : { failedLoginCount: next },
      });
      if (locked) {
        await this.audit.log({
          actorId: user.id,
          action: 'admin.login.locked',
          ip,
        });
      }
      throw invalid();
    }

    if (user.systemRole !== 'admin' || user.suspendedAt) {
      await this.audit.log({
        actorId: user.id,
        action: 'admin.login.denied',
        ip,
      });
      throw new ForbiddenException('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล');
    }

    const tokens = await this.tokens.issue(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    });
    await this.audit.log({ actorId: user.id, action: 'admin.login', ip });
    return { ...tokens, admin: this.toAdmin(user) };
  }

  async refresh(raw: string | undefined): Promise<AdminAuthResult> {
    if (!raw) throw new UnauthorizedException('ไม่พบ refresh token');
    let payload: { sub: string };
    try {
      payload = await this.tokens.verifyRefresh(raw);
    } catch {
      throw new UnauthorizedException('refresh token ไม่ถูกต้องหรือหมดอายุ');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokens.hash(raw) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('session หมดอายุ');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        publicId: payload.sub,
        systemRole: 'admin',
        suspendedAt: null,
        deletedAt: null,
      },
    });
    if (!user) throw new UnauthorizedException('Admin access revoked');

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await this.tokens.issue(user);
    return { ...tokens, admin: this.toAdmin(user) };
  }

  async logout(raw: string | undefined): Promise<void> {
    if (!raw) return;
    await this.prisma.refreshToken
      .delete({ where: { tokenHash: this.tokens.hash(raw) } })
      .catch(() => undefined);
  }
}
