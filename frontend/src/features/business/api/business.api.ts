import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type {
  ActivityPage,
  BusinessDashboard,
  InsightsResponse,
  ReportKind,
  ReportPeriodKey,
  ReportResult,
} from "../types";

export interface ReportParams {
  period: ReportPeriodKey;
  dateFrom?: string;
  dateTo?: string;
}

const REPORT_PATH: Record<ReportKind, string> = {
  revenue: endpoints.business.reportRevenue,
  expenses: endpoints.business.reportExpenses,
  profit: endpoints.business.reportProfit,
};

export const businessApi = {
  async dashboard(): Promise<BusinessDashboard> {
    const { data } = await api.get<ApiResponse<BusinessDashboard>>(
      endpoints.business.dashboard,
    );
    return data.data;
  },

  async report(kind: ReportKind, params: ReportParams): Promise<ReportResult> {
    const { data } = await api.get<ApiResponse<ReportResult>>(
      REPORT_PATH[kind],
      { params },
    );
    return data.data;
  },

  async insights(): Promise<InsightsResponse> {
    const { data } = await api.get<ApiResponse<InsightsResponse>>(
      endpoints.business.insights,
    );
    return data.data;
  },

  async activity(params: {
    cursor?: string;
    action?: string;
    limit?: number;
  }): Promise<ActivityPage> {
    const { data } = await api.get<ApiResponse<ActivityPage>>(
      endpoints.activity.base,
      { params },
    );
    return data.data;
  },

  /** export → ดึงเป็น blob (แนบ auth + workspace header ผ่าน interceptor) แล้วสั่งดาวน์โหลด */
  async exportReport(
    format: "pdf" | "excel",
    params: { report: ReportKind } & ReportParams,
  ): Promise<void> {
    const url =
      format === "pdf"
        ? endpoints.business.exportPdf
        : endpoints.business.exportExcel;
    const res = await api.get<Blob>(url, { params, responseType: "blob" });

    const ext = format === "pdf" ? "pdf" : "xlsx";
    const filename = `${params.report}-${params.period}.${ext}`;
    const blobUrl = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};
