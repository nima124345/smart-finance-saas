import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  REFRESH_COOKIE,
  clearRefreshCookieOptions,
  refreshCookieOptions,
} from '../../common/constants/cookie';
import { AuthService, AuthResult } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get cookieCfg() {
    return {
      secure: this.config.get<boolean>('cookie.secure', false),
      sameSite: this.config.get<'lax' | 'none' | 'strict'>('cookie.sameSite', 'lax'),
      domain: this.config.get<string | undefined>('cookie.domain'),
    };
  }

  /** ตั้ง httpOnly cookie + คืนเฉพาะ accessToken + user (ไม่ leak refresh token ใน body) */
  private setRefreshCookie(res: Response, result: AuthResult) {
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(this.cookieCfg));
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    return this.setRefreshCookie(res, result);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // brute-force protection
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    return this.setRefreshCookie(res, result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const result = await this.authService.refresh(raw);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(this.cookieCfg));
    return { accessToken: result.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(raw);
    res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions(this.cookieCfg));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
