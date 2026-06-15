/**
 * Money/date formatters
 * เงินจาก API = สตางค์ (BigInt → string). แปลงเป็นบาทตอนแสดงผลเท่านั้น
 */

/** 10050 (สตางค์) → "฿100.50" */
export function formatMoney(
  satang: number | string | bigint,
  currency = "THB",
  locale = "th-TH",
): string {
  const baht = Number(satang) / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(baht);
}

/** บาท (input ผู้ใช้) → สตางค์ (ส่งไป API) */
export function toSatang(baht: number | string): number {
  return Math.round(Number(baht) * 100);
}

/** ISO/Date → "15 มิ.ย. 2569" */
export function formatDate(date: string | Date, locale = "th-TH"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** "2026-06" (YYYY-MM) สำหรับ filter รายเดือน */
export function toMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
