/**
 * Env validation ตอน boot — fail fast ถ้า config สำคัญหาย/อ่อนเกินไป
 * (ใช้กับ ConfigModule.forRoot({ validate }))
 */
const REQUIRED = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  // admin namespace แยก — ถ้าหายไปจะ fallback เป็น '' → token ปลอมได้ (ต้องบังคับ)
  'JWT_ADMIN_ACCESS_SECRET',
  'JWT_ADMIN_REFRESH_SECRET',
] as const;

/** secret ที่ใช้เซ็น JWT — ต้องยาวพอกัน brute-force */
const SECRET_KEYS = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ADMIN_ACCESS_SECRET',
  'JWT_ADMIN_REFRESH_SECRET',
] as const;
const MIN_SECRET_LEN = 16;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const weak = SECRET_KEYS.filter(
    (key) => String(config[key]).length < MIN_SECRET_LEN,
  );
  if (weak.length > 0) {
    throw new Error(
      `JWT secrets ต้องยาว ≥ ${MIN_SECRET_LEN} ตัวอักษร: ${weak.join(', ')}`,
    );
  }

  // production hardening — cookie ต้อง secure (HTTPS) ไม่งั้น token leak ได้
  if (config.NODE_ENV === 'production' && config.COOKIE_SECURE !== 'true') {
    throw new Error(
      'COOKIE_SECURE ต้องเป็น "true" ใน production (HTTPS) — ตั้ง COOKIE_SAMESITE=none ด้วยถ้า frontend/backend คนละ domain',
    );
  }

  return config;
}
