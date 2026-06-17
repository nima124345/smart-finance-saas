import { RuleBasedInsightProvider } from './rule-based-insight.provider';
import { InsightContext } from './insight.types';
import { ReportResult } from '../business-reports.service';
import { ReportKind } from '../dto/export-query.dto';

function baseReport(over: Partial<ReportResult['summary']>): ReportResult {
  return {
    kind: ReportKind.Expenses,
    period: {
      key: 'this_month',
      label: '2026-06',
      start: '2026-06-01',
      end: '2026-06-30',
      granularity: 'day',
    },
    summary: {
      revenue: '1000000',
      expense: '600000',
      net: '400000',
      margin: 40,
      count: 20,
      prevRevenue: '1000000',
      prevExpense: '600000',
      prevNet: '400000',
      revenueGrowthPct: 0,
      expenseGrowthPct: 0,
      netGrowthPct: 0,
      ...over,
    },
    categories: [],
    trend: [],
  };
}

describe('RuleBasedInsightProvider', () => {
  const provider = new RuleBasedInsightProvider();

  const ctx = (
    summary: Partial<ReportResult['summary']>,
    expenseCategories: ReportResult['categories'] = [],
    prevExpenseByName = new Map<string, bigint>(),
  ): InsightContext => ({
    current: baseReport(summary),
    expenseCategories,
    revenueCategories: [],
    prevExpenseByName,
  });

  it('รายได้ตก > 10% → warning revenue.declining', () => {
    const res = provider.generate(ctx({ revenueGrowthPct: -18 }));
    expect(res.find((i) => i.code === 'revenue.declining')).toBeDefined();
  });

  it('ค่าใช้จ่ายเพิ่ม > 15% → warning expense.rising', () => {
    const res = provider.generate(ctx({ expenseGrowthPct: 22 }));
    expect(res.find((i) => i.code === 'expense.rising')).toBeDefined();
  });

  it('ขาดทุน (net < 0) → critical และอยู่บนสุด', () => {
    const res = provider.generate(
      ctx({ revenue: '100000', expense: '150000', net: '-50000' }),
    );
    expect(res[0].code).toBe('profit.negative');
    expect(res[0].severity).toBe('critical');
  });

  it('ต้นทุนเงินเดือน > 50% ของรายได้ → warning salary', () => {
    const res = provider.generate(
      ctx({ revenue: '1000000', expense: '600000', net: '400000' }, [
        { categoryId: 'c1', name: 'เงินเดือนพนักงาน', total: '600000', pct: 100 },
      ]),
    );
    expect(res.find((i) => i.code === 'salary.exceeds_threshold')).toBeDefined();
  });

  it('หมวดวัตถุดิบโต > 25% เทียบเดือนก่อน → category.spike', () => {
    const res = provider.generate(
      ctx(
        {},
        [{ categoryId: 'c1', name: 'วัตถุดิบ/สต๊อก', total: '130000', pct: 30 }],
        new Map([['วัตถุดิบ/สต๊อก', 100000n]]),
      ),
    );
    const spike = res.find((i) => i.code === 'category.spike');
    expect(spike).toBeDefined();
    expect(spike?.metric).toBe('+30%');
  });

  it('ธุรกิจสุขภาพดี (ทุกอย่างนิ่ง) → ไม่มี insight เชิงลบ', () => {
    const res = provider.generate(ctx({}));
    expect(res.every((i) => i.severity !== 'critical')).toBe(true);
  });
});
