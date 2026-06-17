import {
  enumerateBuckets,
  growthPct,
  resolvePeriod,
  ReportPeriod,
} from './business-period';

describe('business-period', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    // 15 มิ.ย. 2026 (เดือนมิถุนายน, index 5)
    jest.setSystemTime(new Date('2026-06-15T08:00:00.000Z'));
  });
  afterAll(() => jest.useRealTimers());

  describe('resolvePeriod', () => {
    it('this_month → ครอบทั้งเดือนปัจจุบัน + prev = เดือนก่อน', () => {
      const r = resolvePeriod(ReportPeriod.ThisMonth);
      expect(r.start.toISOString().slice(0, 10)).toBe('2026-06-01');
      expect(r.end.toISOString().slice(0, 10)).toBe('2026-07-01');
      expect(r.prevStart.toISOString().slice(0, 10)).toBe('2026-05-01');
      expect(r.prevEnd.toISOString().slice(0, 10)).toBe('2026-06-01');
      expect(r.granularity).toBe('day');
      expect(r.label).toBe('2026-06');
    });

    it('last_month → เดือนก่อนหน้า', () => {
      const r = resolvePeriod(ReportPeriod.LastMonth);
      expect(r.start.toISOString().slice(0, 10)).toBe('2026-05-01');
      expect(r.end.toISOString().slice(0, 10)).toBe('2026-06-01');
      expect(r.label).toBe('2026-05');
    });

    it('custom_range → inclusive ปลายช่วง + granularity day เมื่อช่วงสั้น', () => {
      const r = resolvePeriod(ReportPeriod.Custom, '2026-06-01', '2026-06-07');
      expect(r.start.toISOString().slice(0, 10)).toBe('2026-06-01');
      // end = 2026-06-08 (exclusive) เพราะ inclusive ถึง 06-07
      expect(r.end.toISOString().slice(0, 10)).toBe('2026-06-08');
      expect(r.granularity).toBe('day');
    });

    it('custom_range ช่วงยาว → granularity month', () => {
      const r = resolvePeriod(ReportPeriod.Custom, '2026-01-01', '2026-06-30');
      expect(r.granularity).toBe('month');
    });
  });

  describe('enumerateBuckets', () => {
    it('นับ bucket รายวันถูกต้อง (7 วัน)', () => {
      const r = resolvePeriod(ReportPeriod.Custom, '2026-06-01', '2026-06-07');
      const buckets = enumerateBuckets(r);
      expect(buckets).toHaveLength(7);
      expect(buckets[0]).toBe('2026-06-01');
      expect(buckets[6]).toBe('2026-06-07');
    });
  });

  describe('growthPct', () => {
    it('คำนวณ % เพิ่มขึ้นถูกต้อง', () => {
      expect(growthPct(120n, 100n)).toBe(20);
      expect(growthPct(80n, 100n)).toBe(-20);
    });
    it('ฐานเป็น 0 → null', () => {
      expect(growthPct(100n, 0n)).toBeNull();
    });
  });
});
