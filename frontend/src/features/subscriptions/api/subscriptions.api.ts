import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { PlanCode } from "@/types/domain";
import type { CurrentSubscription, Plan } from "../types";

export const subscriptionsApi = {
  async plans(): Promise<Plan[]> {
    const { data } = await api.get<ApiResponse<Plan[]>>(
      endpoints.subscriptions.plans,
    );
    return data.data;
  },
  async current(): Promise<CurrentSubscription> {
    const { data } = await api.get<ApiResponse<CurrentSubscription>>(
      endpoints.subscriptions.current,
    );
    return data.data;
  },
  async changePlan(plan: PlanCode): Promise<CurrentSubscription> {
    const { data } = await api.post<ApiResponse<CurrentSubscription>>(
      endpoints.subscriptions.changePlan,
      { plan },
    );
    return data.data;
  },
  async cancel(): Promise<CurrentSubscription> {
    const { data } = await api.post<ApiResponse<CurrentSubscription>>(
      endpoints.subscriptions.cancel,
    );
    return data.data;
  },
};
