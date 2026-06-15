export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '8000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
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
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
});
