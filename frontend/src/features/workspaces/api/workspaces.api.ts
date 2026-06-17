import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { Workspace, WorkspaceType } from "@/types/domain";

export interface CreateWorkspaceInput {
  name: string;
  type: WorkspaceType;
  baseCurrency?: string;
}

export const workspacesApi = {
  async list(): Promise<Workspace[]> {
    const { data } = await api.get<ApiResponse<Workspace[]>>(
      endpoints.workspaces.list,
    );
    return data.data;
  },
  async create(body: CreateWorkspaceInput): Promise<Workspace> {
    const { data } = await api.post<ApiResponse<Workspace>>(
      endpoints.workspaces.create,
      body,
    );
    return data.data;
  },
};
