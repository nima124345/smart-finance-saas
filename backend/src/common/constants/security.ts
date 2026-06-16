/**
 * Brute-force account lockout — ล็อกบัญชีชั่วคราวเมื่อใส่รหัสผ่านผิดติดกันถึงเกณฑ์
 * (เสริม rate limit ราย IP — กันกรณีหมุน IP เดารหัสของบัญชีเดียว)
 *
 * NOTE: หน้าต่างล็อกสั้น + ตอบ error แบบ generic เพื่อลดความเสี่ยง
 * targeted lockout DoS และไม่เปิดเผยว่าบัญชีมีอยู่จริง
 */
export const MAX_FAILED_LOGINS = 10;
export const LOCKOUT_MS = 15 * 60 * 1000; // 15 นาที
