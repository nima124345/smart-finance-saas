import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { Category } from "@/types/domain";

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await api.get<ApiResponse<Category[]>>(
      endpoints.categories.base,
    );
    return data.data;
  },
};
