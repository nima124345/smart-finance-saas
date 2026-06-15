import type { Transaction } from "@/types/domain";

export type DashboardRange =
  | "this_month"
  | "last_month"
  | "3m"
  | "6m"
  | "12m"
  | "custom";

export interface DashboardOverview {
  range: {
    key: DashboardRange;
    start: string;
    end: string;
    granularity: "day" | "month";
  };
  stats: {
    totalBalance: string;
    income: string;
    expense: string;
    net: string;
  };
  insights: {
    topExpenseCategory: { name: string; total: string } | null;
    incomeChangePct: number | null;
    expenseChangePct: number | null;
    prevIncome: string;
    prevExpense: string;
  };
  trend: { label: string; income: string; expense: string }[];
  categoryBreakdown: {
    categoryId: string;
    name: string;
    type: "income" | "expense";
    total: string;
  }[];
  topExpenseCategories: { categoryId: string; name: string; total: string }[];
  walletSummary: { publicId: string; name: string; balance: string }[];
  recentTransactions: Transaction[];
  hasData: boolean;
}
