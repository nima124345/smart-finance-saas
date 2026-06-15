import { CookieOptions } from 'express';

import { CookieConfig } from '../../../common/constants/cookie';

/** Cookie namespace แยกจาก tenant (admin_refresh_token) */
export const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';
export const ADMIN_COOKIE_PATH = '/api/v1/admin/auth';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 วัน

export function adminCookieOptions(cfg: CookieConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: cfg.secure,
    sameSite: cfg.sameSite,
    domain: cfg.domain,
    path: ADMIN_COOKIE_PATH,
    maxAge: MAX_AGE_MS,
  };
}

export function clearAdminCookieOptions(cfg: CookieConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: cfg.secure,
    sameSite: cfg.sameSite,
    domain: cfg.domain,
    path: ADMIN_COOKIE_PATH,
  };
}
