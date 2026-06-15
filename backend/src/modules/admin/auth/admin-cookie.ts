import { CookieOptions } from 'express';

/** Cookie namespace แยกจาก tenant (admin_refresh_token) */
export const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';
export const ADMIN_COOKIE_PATH = '/api/v1/admin/auth';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 วัน

export function adminCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: ADMIN_COOKIE_PATH,
    maxAge: MAX_AGE_MS,
  };
}

export function clearAdminCookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'lax', path: ADMIN_COOKIE_PATH };
}
