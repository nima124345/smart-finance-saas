import { createHash, randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string; // raw (ส่งกลับไปตั้ง cookie เท่านั้น)
}

/** ออก/หมุน/เพิกถอน token + จัดการ refresh token hash ใน DB */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** SHA-256 hex — เก็บ hash ของ refresh token (token เป็น high-entropy, ไม่ต้อง argon2) */
  hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private signAccess(user: Pick<User, 'publicId' | 'email'>): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.publicId, email: user.email },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl', '15m'),
      },
    );
  }

  private signRefresh(user: Pick<User, 'publicId'>): Promise<string> {
    // jti = entropy เพิ่ม ทำให้ token ไม่ซ้ำแม้ payload เดียวกัน
    return this.jwt.signAsync(
      { sub: user.publicId, jti: randomBytes(16).toString('hex') },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshTtl', '30d'),
      },
    );
  }

  /** ออก access + refresh ใหม่ และบันทึก hash ของ refresh ลง DB */
  async issueTokens(user: User): Promise<IssuedTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccess(user),
      this.signRefresh(user),
    ]);

    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /** verify ลายเซ็น refresh token + คืน payload (โยน error ถ้าไม่ถูกต้อง/หมดอายุ) */
  verifyRefresh(raw: string): Promise<{ sub: string; jti: string }> {
    return this.jwt.verifyAsync(raw, {
      secret: this.config.get<string>('jwt.refreshSecret'),
    });
  }

  /** เพิกถอน refresh token ทั้งหมดของ user (logout-all / reset password / reuse detection) */
  async revokeAllForUser(userId: bigint): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
