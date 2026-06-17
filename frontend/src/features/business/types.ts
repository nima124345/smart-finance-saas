export type ReportPeriodKey = "this_month" | "last_month" | "custom_range";
export type ReportKind = "revenue" | "expenses" | "profit";
export type InsightSeverity = "positive" | "info" | "warning" | "critical";

export interface PeriodMeta {
  key: string;
  label: string;
  start: string;
  end: string;
  granularity: "day" | "month";
}

export interface CategoryRow {
  categoryId: string | null;
  name: string;
  total: string; // satang
  pct: number;
}

export interface BucketRow {
  label: string;
  income: string;
  expense: string;
  net: string;
}

export interface ReportSummary {
  revenue: string;
  expense: string;
  net: string;
  margin: number | null;
  count: number;
  prevRevenue: string;
  prevExpense: string;
  prevNet: string;
  revenueGrowthPct: number | null;
  expenseGrowthPct: number | null;
  netGrowthPct: number | null;
}

export interface ReportResult {
  kind: ReportKind;
  period: PeriodMeta;
  summary: ReportSummary;
  categories: CategoryRow[];
  trend: BucketRow[];
}

export interface ActivityActor {
  publicId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ActivityItem {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: ActivityActor | null;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextCursor: string | null;
}

export interface ActivitySummary {
  sinceDays: number;
  total: number;
  byAction: Record<string, number>;
}

export interface BusinessDashboard {
  period: PeriodMeta;
  metrics: {
    dailyRevenue: string;
    monthlyRevenue: string;
    monthlyExpenses: string;
    netProfit: string;
    margin: number | null;
    transactionCount: number;
    revenueGrowthPct: number | null;
    expenseGrowthPct: number | null;
    netGrowthPct: number | null;
  };
  revenueTrend: { label: string; amount: string }[];
  expenseTrend: { label: string; amount: string }[];
  topRevenueCategories: CategoryRow[];
  topExpenseCategories: CategoryRow[];
  teamActivity: { summary: ActivitySummary; recent: ActivityItem[] };
}

export interface Insight {
  code: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  metric?: string;
  recommendation?: string;
}

export interface InsightsResponse {
  provider: string;
  period: PeriodMeta;
  summary: ReportSummary;
  count: number;
  insights: Insight[];
}
