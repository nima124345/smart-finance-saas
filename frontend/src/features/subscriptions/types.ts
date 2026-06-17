import type { PlanCode } from "@/types/domain";

export interface PlanFeatures {
  advancedDashboard: boolean;
  exportCsv: boolean;
  teamMembers: boolean;
  businessDashboard: boolean;
  businessReports: boolean;
  activityLog: boolean;
  aiInsights: boolean;
}

export interface Plan {
  code: PlanCode;
  name: string;
  price: string; // satang/month
  maxWorkspaces: number | null;
  maxWallets: number | null;
  maxTransactionsMonth: number | null;
  maxMembers: number | null;
  features: PlanFeatures;
}

export interface UsageMetric {
  used: number;
  limit: number | null; // null = unlimited
}

export interface CurrentSubscription {
  plan: Plan;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  isTrialing: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  usage: {
    wallets: UsageMetric;
    transactions: UsageMetric;
  };
}
