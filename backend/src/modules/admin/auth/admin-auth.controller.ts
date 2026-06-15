import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { Public } from '../../../common/decorators/public.decorator';
import { LoginDto } from '../../auth/dto/login.dto';
import { AdminAuthService, AdminAuthResult } from './admin-auth.service';
import { AdminJwtGuard } from './admin-jwt.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminUser } from './admin-jwt.strategy';
import {
  ADMIN_REFRESH_COOKIE,
  adminCookieOptions,
  clearAdminCookieOptions,
} from './admin-cookie';

@Public() // ข้าม tenant JwtAuthGuard — ใช้ admin namespace แทน
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly config: ConfigService,
  ) {}

  private get secure(): boolean {
    return this.config.get<boolean>('cookie.secure', false);
  }

  private setCookie(res: Response, result: AdminAuthResult) {
    res.cookie(ADMIN_REFRESH_COOKIE, result.refreshToken, adminCookieOptions(this.secure));
    return { accessToken: result.accessToken, admin: result.admin };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // brute-force protection
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip ?? req.socket?.remoteAddress;
    const result = await this.auth.login(dto.email, dto.password, ip);
    return this.setCookie(res, result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[ADMIN_REFRESH_COOKIE] as string | undefined;
    const result = await this.auth.refresh(raw);
    res.cookie(ADMIN_REFRESH_COOKIE, result.refreshToken, adminCookieOptions(this.secure));
    return { accessToken: result.accessToken, admin: result.admin };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies?.[ADMIN_REFRESH_COOKIE] as string | undefined);
    res.clearCookie(ADMIN_REFRESH_COOKIE, clearAdminCookieOptions(this.secure));
  }

  @UseGuards(AdminJwtGuard)
  @Get('me')
  me(@CurrentAdmin() admin: AdminUser) {
    return { publicId: admin.publicId, name: admin.name, email: admin.email };
  }
}
