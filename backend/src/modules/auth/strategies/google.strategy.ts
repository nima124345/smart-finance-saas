import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

/** ข้อมูลที่ดึงจาก Google profile → กลายเป็น req.user ใน callback handler */
export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      // fallback 'not-configured' เพื่อให้ app boot ได้แม้ยังไม่ตั้ง GOOGLE_* env
      // (passport ต้องการ string ไม่ว่าง; จะ fail จริงตอน flow OAuth ถ้าไม่ได้ตั้งค่า)
      clientID: config.get<string>('google.clientId') || 'not-configured',
      clientSecret:
        config.get<string>('google.clientSecret') || 'not-configured',
      callbackURL: config.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('บัญชี Google นี้ไม่มีอีเมล'), undefined);
      return;
    }

    const user: GoogleProfile = {
      googleId: profile.id,
      email: email.toLowerCase(),
      name: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, user);
  }
}
