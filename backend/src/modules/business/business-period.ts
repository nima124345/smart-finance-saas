/** ช่วงเวลาของรายงานธุรกิจ (this_month / last_month / custom_range) */
export enum ReportPeriod {
  ThisMonth = 'this_month',
  LastMonth = 'last_month',
  Custom = 'custom_range',
}

export interface ResolvedPeriod {
  start: Date; // inclusive
  end: Date; // exclusive
  prevStart: Date; // ช่วงก่อนหน้า (เทียบ growth)
  prevEnd: Date;
  granularity: 'day' | 'month';
  label: string; // YYYY-MM หรือ YYYY-MM-DD..YYYY-MM-DD
}

function monthStart(y: number, mIndex: number): Date {
  return new Date(Date.UTC(y, mIndex, 1));
}

const DAY_MS = 86400000;

/**
 * resolve ช่วงเวลา (UTC, อิง DATE column) + ช่วงก่อนหน้าเพื่อคำนวณ growth
 * custom: dateFrom/dateTo เป็น YYYY-MM-DD (inclusive ทั้งคู่)
 */
export function resolvePeriod(
  period: ReportPeriod,
  dateFrom?: string,
  dateTo?: string,
): ResolvedPeriod {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  if (period === ReportPeriod.LastMonth) {
    const start = monthStart(y, m - 1);
    const end = monthStart(y, m);
    return {
      start,
      end,
      prevStart: monthStart(y, m - 2),
      prevEnd: start,
      granularity: 'day',
      label: start.toISOString().slice(0, 7),
    };
  }

  if (period === ReportPeriod.Custom) {
    const start = new Date(`${dateFrom ?? '2000-01-01'}T00:00:00.000Z`);
    const end = new Date(`${dateTo ?? '2100-01-01'}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1); // inclusive ปลายช่วง
    const span = end.getTime() - start.getTime();
    return {
      start,
      end,
      prevStart: new Date(start.getTime() - span),
      prevEnd: start,
      granularity: span <= 46 * DAY_MS ? 'day' : 'month',
      label: `${start.toISOString().slice(0, 10)}..${new Date(
        end.getTime() - DAY_MS,
      )
        .toISOString()
        .slice(0, 10)}`,
    };
  }

  // ThisMonth (default)
  const start = monthStart(y, m);
  const end = monthStart(y, m + 1);
  return {
    start,
    end,
    prevStart: monthStart(y, m - 1),
    prevEnd: start,
    granularity: 'day',
    label: start.toISOString().slice(0, 7),
  };
}

export function bucketKey(d: Date, g: 'day' | 'month'): string {
  return g === 'day' ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7);
}

export function enumerateBuckets(r: ResolvedPeriod): string[] {
  const out: string[] = [];
  const cur = new Date(r.start);
  while (cur < r.end) {
    out.push(bucketKey(cur, r.granularity));
    if (r.granularity === 'day') cur.setUTCDate(cur.getUTCDate() + 1);
    else cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

/** growth % เทียบช่วงก่อนหน้า (null = ไม่มีฐานเทียบ) */
export function growthPct(cur: bigint, prev: bigint): number | null {
  if (prev === 0n) return null;
  return Math.round((Number(cur - prev) / Number(prev)) * 1000) / 10;
}
