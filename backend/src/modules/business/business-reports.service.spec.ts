import { PrismaService } from '../../prisma/prisma.service';
import { BusinessReportsService } from './business-reports.service';
import { ReportKind } from './dto/export-query.dto';
import { ReportPeriod } from './business-period';

describe('BusinessReportsService.build', () => {
  let prisma: jest.Mocked<
    Pick<PrismaService['transaction'], 'groupBy' | 'findMany'>
  > &
    any;
  let service: BusinessReportsService;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T08:00:00.000Z'));
  });
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    const transaction = {
      groupBy: jest.fn((args: { by: string[]; where: any }) => {
        if (args.by[0] === 'type') {
          const gte: Date = args.where.transactionDate.gte;
          // เดือนปัจจุบัน (มิ.ย. = index 5) vs เดือนก่อน (พ.ค. = 4)
          if (gte.getUTCMonth() === 5) {
            return Promise.resolve([
              { type: 'income', _sum: { amount: 100000n }, _count: { _all: 5 } },
              { type: 'expense', _sum: { amount: 40000n }, _count: { _all: 3 } },
            ]);
          }
          return Promise.resolve([
            { type: 'income', _sum: { amount: 80000n }, _count: { _all: 4 } },
            { type: 'expense', _sum: { amount: 50000n }, _count: { _all: 2 } },
          ]);
        }
        // breakdown ตาม categoryId
        return Promise.resolve([
          { categoryId: 1n, _sum: { amount: 30000n } },
          { categoryId: 2n, _sum: { amount: 10000n } },
        ]);
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          type: 'income',
          amount: 100000n,
          transactionDate: new Date('2026-06-10T00:00:00.000Z'),
        },
        {
          type: 'expense',
          amount: 40000n,
          transactionDate: new Date('2026-06-12T00:00:00.000Z'),
        },
      ]),
    };
    const category = {
      findMany: jest.fn().mockResolvedValue([
        { id: 1n, publicId: 'c1', name: 'วัตถุดิบ' },
        { id: 2n, publicId: 'c2', name: 'ค่าเช่า' },
      ]),
    };
    prisma = { transaction, category } as any;
    service = new BusinessReportsService(prisma);
  });

  it('คำนวณ summary (revenue/expense/net/margin/growth) ถูกต้อง', async () => {
    const r = await service.build(1n, ReportKind.Profit, {
      period: ReportPeriod.ThisMonth,
    });

    expect(r.summary.revenue).toBe('100000');
    expect(r.summary.expense).toBe('40000');
    expect(r.summary.net).toBe('60000');
    expect(r.summary.margin).toBe(60); // 60000/100000
    expect(r.summary.count).toBe(8);
    expect(r.summary.revenueGrowthPct).toBe(25); // 100k vs 80k
    expect(r.summary.expenseGrowthPct).toBe(-20); // 40k vs 50k
    expect(r.summary.netGrowthPct).toBe(100); // 60k vs 30k
  });

  it('category breakdown เรียงมาก→น้อย + คำนวณ pct', async () => {
    const r = await service.build(1n, ReportKind.Expenses, {
      period: ReportPeriod.ThisMonth,
    });

    expect(r.categories).toHaveLength(2);
    expect(r.categories[0]).toMatchObject({ name: 'วัตถุดิบ', total: '30000', pct: 75 });
    expect(r.categories[1]).toMatchObject({ name: 'ค่าเช่า', total: '10000', pct: 25 });
  });

  it('trend เติม bucket ครบทั้งเดือน + ใส่ยอดตรงวัน', async () => {
    const r = await service.build(1n, ReportKind.Revenue, {
      period: ReportPeriod.ThisMonth,
    });
    expect(r.trend).toHaveLength(30); // มิ.ย. มี 30 วัน
    const d10 = r.trend.find((b) => b.label === '2026-06-10');
    const d12 = r.trend.find((b) => b.label === '2026-06-12');
    expect(d10?.income).toBe('100000');
    expect(d12?.expense).toBe('40000');
  });
});
