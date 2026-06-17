import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { MembershipRole, Workspace } from "@/types/domain";
import type { InvitePreview, TeamInvitation, TeamMember } from "../types";

export const teamApi = {
  async members(): Promise<TeamMember[]> {
    const { data } = await api.get<ApiResponse<TeamMember[]>>(
      endpoints.team.members,
    );
    return data.data;
  },
  async invitations(): Promise<TeamInvitation[]> {
    const { data } = await api.get<ApiResponse<TeamInvitation[]>>(
      endpoints.team.invitations,
    );
    return data.data;
  },
  async invite(body: {
    email: string;
    role: MembershipRole;
  }): Promise<TeamInvitation> {
    const { data } = await api.post<ApiResponse<TeamInvitation>>(
      endpoints.team.invitations,
      body,
    );
    return data.data;
  },
  async revokeInvitation(publicId: string): Promise<void> {
    await api.delete(endpoints.team.invitation(publicId));
  },
  async changeRole(publicId: string, role: MembershipRole): Promise<void> {
    await api.patch(endpoints.team.memberRole(publicId), { role });
  },
  async removeMember(publicId: string): Promise<void> {
    await api.delete(endpoints.team.member(publicId));
  },

  // ── invitations (public-ish: ต้อง login แต่ไม่ต้องเป็นสมาชิก) ──
  async preview(token: string): Promise<InvitePreview> {
    const { data } = await api.get<ApiResponse<InvitePreview>>(
      endpoints.invitations.preview(token),
    );
    return data.data;
  },
  async accept(token: string): Promise<{ workspace: Workspace; role: MembershipRole }> {
    const { data } = await api.post<
      ApiResponse<{ workspace: Workspace; role: MembershipRole }>
    >(endpoints.invitations.accept, { token });
    return data.data;
  },
};
