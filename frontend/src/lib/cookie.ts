/**
 * Flag cookie (อ่านได้, ไม่ใช่ token) — ให้ middleware (edge) ใช้ตัดสิน protected route
 * refresh token จริงเป็น httpOnly cookie ฝั่ง backend (คนละ origin → middleware อ่านไม่ได้)
 */
const AUTH_FLAG = "sf-auth";
const ADMIN_FLAG = "sf-admin";

export function setAuthFlag() {
  if (typeof document === "undefined") return;
  // 30 วัน (อายุเท่า refresh token)
  document.cookie = `${AUTH_FLAG}=1; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
}

export function clearAuthFlag() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_FLAG}=; path=/; max-age=0`;
}

/** flag แยกสำหรับ admin portal (middleware /admin/*) */
export function setAdminFlag() {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_FLAG}=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
}

export function clearAdminFlag() {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_FLAG}=; path=/; max-age=0`;
}
