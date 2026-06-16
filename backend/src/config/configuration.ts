const list = (v?: string): string[] =>
  (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '8000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    adminUrl: process.env.ADMIN_URL ?? '',
    // อนุญาตหลาย origin (tenant + admin) คั่นด้วย comma; fallback = frontendUrl
    corsOrigins:
      list(process.env.CORS_ORIGIN).length > 0
        ? list(process.env.CORS_ORIGIN)
        : list(
            [process.env.FRONTEND_URL, process.env.ADMIN_URL]
              .filter(Boolean)
              .join(','),
          ) || ['http://localhost:3000'],
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    adminAccessSecret: process.env.JWT_ADMIN_ACCESS_SECRET ?? '',
    adminAccessTtl: process.env.JWT_ADMIN_ACCESS_TTL ?? '15m',
    adminRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET ?? '',
    adminRefreshTtl: process.env.JWT_ADMIN_REFRESH_TTL ?? '7d',
  },
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    // 'lax' = same-site (custom domain), 'none' = cross-site (vercel.app↔railway.app)
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'none' | 'strict',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
    // ตั้ง REDIS_URL → rate limit แชร์ข้าม instance; ไม่ตั้ง = in-memory (เครื่องเดียว)
    redisUrl: process.env.REDIS_URL || undefined,
  },
});
