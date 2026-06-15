import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../../prisma/prisma.service';
import { AdminJwtPayload } from './admin-token.service';

export interface AdminUser {
  id: bigint;
  publicId: string;
  email: string;
  name: string;
}

/** ตรวจ admin access token — ต้อง scope=admin + system_role=admin + ไม่ถูกระงับ */
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.adminAccessSecret', ''),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminUser> {
    if (payload.scope !== 'admin') {
      throw new UnauthorizedException('Invalid admin token');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        publicId: payload.sub,
        deletedAt: null,
        systemRole: 'admin',
        suspendedAt: null,
      },
      select: { id: true, publicId: true, email: true, name: true },
    });
    if (!user) throw new UnauthorizedException('Admin access revoked');
    return user;
  }
}
