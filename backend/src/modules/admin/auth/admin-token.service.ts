import { createHash, randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  scope: 'admin';
  jti?: string;
}

/** ออก/หมุน admin token — secret + scope แยกจาก tenant อย่างสมบูรณ์ */
@Injectable()
export class AdminTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private signAccess(user: Pick<User, 'publicId' | 'email'>): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.publicId, email: user.email, scope: 'admin' },
      {
        secret: this.config.get<string>('jwt.adminAccessSecret'),
        expiresIn: this.config.get<string>('jwt.adminAccessTtl', '15m'),
      },
    );
  }

  private signRefresh(user: Pick<User, 'publicId'>): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.publicId, scope: 'admin', jti: randomBytes(16).toString('hex') },
      {
        secret: this.config.get<string>('jwt.adminRefreshSecret'),
        expiresIn: this.config.get<string>('jwt.adminRefreshTtl', '7d'),
      },
    );
  }

  async issue(user: User): Promise<AdminTokens> {
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

  verifyRefresh(raw: string): Promise<AdminJwtPayload> {
    return this.jwt.verifyAsync(raw, {
      secret: this.config.get<string>('jwt.adminRefreshSecret'),
    });
  }
}
