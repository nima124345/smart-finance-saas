import type { MembershipRole, WorkspaceType } from "@/types/domain";

export interface TeamMember {
  publicId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MembershipRole;
  roleLabel: string;
  lastLoginAt: string | null;
  joinedAt: string;
}

export interface TeamInvitation {
  publicId: string;
  email: string;
  role: MembershipRole;
  roleLabel: string;
  expiresAt: string;
  createdAt: string;
  inviteLink?: string; // non-production เท่านั้น
  inviteToken?: string;
}

export interface InvitePreview {
  email: string;
  role: MembershipRole;
  roleLabel: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  invitedByName: string;
  expiresAt: string;
}
