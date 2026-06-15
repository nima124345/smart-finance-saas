import { CookieOptions } from 'express';

/** ชื่อ + path ของ refresh token cookie (httpOnly) */
export const REFRESH_COOKIE = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 วัน

/** สร้าง cookie options (secure ตาม env) */
export function refreshCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_MAX_AGE_MS,
  };
}

/** options สำหรับ clear cookie (ต้องตรง path/sameSite/httpOnly) */
export function clearRefreshCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  };
}
