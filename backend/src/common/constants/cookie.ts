import { CookieOptions } from 'express';

/** ชื่อ + path ของ refresh token cookie (httpOnly) */
export const REFRESH_COOKIE = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 วัน

export interface CookieConfig {
  secure: boolean;
  sameSite: 'lax' | 'none' | 'strict';
  domain?: string;
}

/** สร้าง cookie options (รองรับ cross-site production: secure + sameSite=none + domain) */
export function refreshCookieOptions(cfg: CookieConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: cfg.secure,
    sameSite: cfg.sameSite,
    domain: cfg.domain,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_MAX_AGE_MS,
  };
}

/** options สำหรับ clear cookie (ต้องตรง path/sameSite/domain) */
export function clearRefreshCookieOptions(cfg: CookieConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: cfg.secure,
    sameSite: cfg.sameSite,
    domain: cfg.domain,
    path: REFRESH_COOKIE_PATH,
  };
}
