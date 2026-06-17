import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { GoogleProfile } from './strategies/google.strategy';
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
  private readonly logger = new Logger(AuthController.name);

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

  // ── GOOGLE OAUTH ──────────────────────────────────────────
  /** เริ่ม flow — AuthGuard('google') เด้งไปหน้า consent ของ Google เอง */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // ไม่มี body — guard จัดการ redirect ไป Google
  }

  /** callback จาก Google → หา/สร้าง user → ตั้ง refresh cookie → redirect กลับ frontend */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontend = this.config.get<string>(
      'app.frontendUrl',
      'http://localhost:3000',
    );
    try {
      const profile = req.user as GoogleProfile;
      const result = await this.authService.loginWithGoogle(profile);
      res.cookie(
        REFRESH_COOKIE,
        result.refreshToken,
        refreshCookieOptions(this.cookieCfg),
      );
      // ไม่ส่ง access token ผ่าน URL — frontend จะ silent-refresh จาก cookie ตอนโหลด
      res.redirect(`${frontend}/dashboard`);
    } catch (err) {
      this.logger.error('Google OAuth callback ล้มเหลว', err as Error);
      res.redirect(`${frontend}/login?error=google`);
    }
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
