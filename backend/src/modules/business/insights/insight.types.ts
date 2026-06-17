import { ReportResult } from '../business-reports.service';

export type InsightSeverity = 'positive' | 'info' | 'warning' | 'critical';

export interface Insight {
  code: string; // เช่น revenue.declining
  severity: InsightSeverity;
  title: string;
  message: string;
  metric?: string; // ตัวเลขประกอบ (เช่น "-18%")
  recommendation?: string;
}

/** ข้อมูลที่ provider ใช้สร้าง insight (เดือนนี้ + เดือนก่อน + breakdown) */
export interface InsightContext {
  current: ReportResult; // this_month (summary มี growth เทียบเดือนก่อนอยู่แล้ว)
  expenseCategories: ReportResult['categories'];
  revenueCategories: ReportResult['categories'];
  prevExpenseByName: Map<string, bigint>; // ชื่อหมวด → ยอดรวมเดือนก่อน (satang)
}

/**
 * แหล่งสร้าง insight — ตอนนี้ใช้ rule-based; อนาคตสลับเป็น Claude ได้
 * โดย implement interface นี้แล้วฉีดผ่าน DI (ดู AiInsightsService)
 */
export interface InsightProvider {
  readonly name: string;
  generate(ctx: InsightContext): Promise<Insight[]> | Insight[];
}

export const INSIGHT_PROVIDER = Symbol('INSIGHT_PROVIDER');
