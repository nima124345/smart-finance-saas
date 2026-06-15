import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { DashboardOverview, DashboardRange } from "../types";

export const dashboardApi = {
  async overview(
    range: DashboardRange,
    custom?: { dateFrom?: string; dateTo?: string },
  ): Promise<DashboardOverview> {
    const { data } = await api.get<ApiResponse<DashboardOverview>>(
      endpoints.dashboard.overview,
      { params: { range, ...custom } },
    );
    return data.data;
  },
};
