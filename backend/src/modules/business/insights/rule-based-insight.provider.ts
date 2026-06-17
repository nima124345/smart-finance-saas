import { Injectable } from '@nestjs/common';

import { Insight, InsightContext, InsightProvider } from './insight.types';

// เกณฑ์ (ปรับได้) — หน่วยเป็น % หรือสัดส่วน
const TH = {
  revenueDropPct: -10,
  revenueGrowPct: 10,
  expenseGrowPct: 15,
  netDropPct: -12,
  categoryConcentrationPct: 40, // หมวดเดียวกินสัดส่วนรายจ่ายเกินนี้ = น่าจับตา
  salaryToRevenuePct: 50, // ต้นทุนเงินเดือน/รายได้ เกินนี้ = เตือน
  categorySpikePct: 25, // หมวดโตเร็วเทียบเดือนก่อน
};

// ชื่อหมวดที่มีความหมายเชิงธุรกิจ (ตรงกับ business default categories)
const SALARY = 'เงินเดือนพนักงาน';
const INVENTORY = 'วัตถุดิบ/สต๊อก';

function pctChange(cur: bigint, prev: bigint): number | null {
  if (prev === 0n) return null;
  return Math.round((Number(cur - prev) / Number(prev)) * 1000) / 10;
}

/**
 * Rule-based insight engine — deterministic, ไม่มีค่า API
 * (interface เดียวกับที่ ClaudeInsightProvider จะ implement ในอนาคต)
 */
@Injectable()
export class RuleBasedInsightProvider implements InsightProvider {
  readonly name = 'rule-based';

  generate(ctx: InsightContext): Insight[] {
    const out: Insight[] = [];
    const s = ctx.current.summary;
    const revenue = BigInt(s.revenue);
    const expense = BigInt(s.expense);
    const net = BigInt(s.net);

    // 1) แนวโน้มรายได้
    if (s.revenueGrowthPct != null && s.revenueGrowthPct <= TH.revenueDropPct) {
      out.push({
        code: 'revenue.declining',
        severity: 'warning',
        title: 'รายได้มีแนวโน้มลดลง',
        message: `รายได้เดือนนี้ลดลง ${Math.abs(s.revenueGrowthPct)}% เทียบเดือนก่อน`,
        metric: `${s.revenueGrowthPct}%`,
        recommendation: 'ทบทวนช่องทางขาย/โปรโมชัน และติดตามลูกค้าหลักที่หายไป',
      });
    } else if (
      s.revenueGrowthPct != null &&
      s.revenueGrowthPct >= TH.revenueGrowPct
    ) {
      out.push({
        code: 'revenue.growing',
        severity: 'positive',
        title: 'รายได้เติบโตดี',
        message: `รายได้เดือนนี้เพิ่มขึ้น ${s.revenueGrowthPct}% เทียบเดือนก่อน`,
        metric: `+${s.revenueGrowthPct}%`,
      });
    }

    // 2) ค่าใช้จ่ายพุ่ง
    if (s.expenseGrowthPct != null && s.expenseGrowthPct >= TH.expenseGrowPct) {
      out.push({
        code: 'expense.rising',
        severity: 'warning',
        title: 'ค่าใช้จ่ายเพิ่มขึ้นเร็ว',
        message: `ค่าใช้จ่ายรวมเพิ่มขึ้น ${s.expenseGrowthPct}% เทียบเดือนก่อน`,
        metric: `+${s.expenseGrowthPct}%`,
        recommendation: 'ตรวจหมวดที่โตผิดปกติด้านล่าง และเจรจาต้นทุนกับซัพพลายเออร์',
      });
    }

    // 3) กำไรสุทธิ
    if (net < 0n) {
      out.push({
        code: 'profit.negative',
        severity: 'critical',
        title: 'เดือนนี้ขาดทุน',
        message: `รายจ่ายมากกว่ารายได้ ${this.baht(expense - revenue)} บาท`,
        recommendation: 'ลดต้นทุนคงที่ที่ไม่จำเป็น หรือเพิ่มยอดขายเร่งด่วน',
      });
    } else if (s.netGrowthPct != null && s.netGrowthPct <= TH.netDropPct) {
      out.push({
        code: 'profit.shrinking',
        severity: 'warning',
        title: 'กำไรหดตัว',
        message: `กำไรสุทธิลดลง ${Math.abs(s.netGrowthPct)}% เทียบเดือนก่อน`,
        metric: `${s.netGrowthPct}%`,
      });
    }

    // 4) การกระจุกตัวของค่าใช้จ่าย
    const topExpense = ctx.expenseCategories[0];
    if (topExpense && topExpense.pct >= TH.categoryConcentrationPct) {
      out.push({
        code: 'expense.concentration',
        severity: 'info',
        title: 'ค่าใช้จ่ายกระจุกตัว',
        message: `หมวด "${topExpense.name}" คิดเป็น ${topExpense.pct}% ของรายจ่ายทั้งหมด`,
        metric: `${topExpense.pct}%`,
        recommendation: 'กระจายความเสี่ยงหรือหาทางลดต้นทุนหมวดนี้',
      });
    }

    // 5) ต้นทุนเงินเดือนเทียบรายได้
    const salary = ctx.expenseCategories.find((c) => c.name === SALARY);
    if (salary && revenue > 0n) {
      const ratio =
        Math.round((Number(BigInt(salary.total)) / Number(revenue)) * 1000) / 10;
      if (ratio >= TH.salaryToRevenuePct) {
        out.push({
          code: 'salary.exceeds_threshold',
          severity: 'warning',
          title: 'ต้นทุนเงินเดือนสูง',
          message: `ค่าจ้างพนักงานคิดเป็น ${ratio}% ของรายได้ (เกินเกณฑ์แนะนำ ${TH.salaryToRevenuePct}%)`,
          metric: `${ratio}%`,
          recommendation: 'ทบทวนประสิทธิภาพแรงงานหรือจัดตารางกะให้เหมาะกับยอดขาย',
        });
      }
    }

    // 6) หมวดที่โตเร็วผิดปกติ (เทียบเดือนก่อน) — เน้นวัตถุดิบ
    for (const cat of ctx.expenseCategories) {
      const prev = ctx.prevExpenseByName.get(cat.name);
      if (prev == null || prev === 0n) continue;
      const change = pctChange(BigInt(cat.total), prev);
      if (change != null && change >= TH.categorySpikePct) {
        out.push({
          code: 'category.spike',
          severity: cat.name === INVENTORY ? 'warning' : 'info',
          title: `หมวด "${cat.name}" โตเร็ว`,
          message: `ค่าใช้จ่ายหมวด "${cat.name}" เพิ่มขึ้น ${change}% เทียบเดือนก่อน`,
          metric: `+${change}%`,
        });
      }
    }

    return this.sortBySeverity(out);
  }

  private baht(satang: bigint): string {
    return (Number(satang) / 100).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private sortBySeverity(insights: Insight[]): Insight[] {
    const order: Record<string, number> = {
      critical: 0,
      warning: 1,
      positive: 2,
      info: 3,
    };
    return [...insights].sort((a, b) => order[a.severity] - order[b.severity]);
  }
}
