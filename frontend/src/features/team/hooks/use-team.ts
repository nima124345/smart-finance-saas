"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useWorkspaceStore } from "@/stores/workspace-store";
import type { MembershipRole } from "@/types/domain";
import { teamApi } from "../api/team.api";

function useWs() {
  return useWorkspaceStore((s) => s.activeWorkspaceId) ?? "none";
}

export function useMembers() {
  const ws = useWs();
  return useQuery({
    queryKey: ["ws", ws, "team", "members"],
    queryFn: teamApi.members,
    enabled: ws !== "none",
  });
}

export function useInvitations() {
  const ws = useWs();
  return useQuery({
    queryKey: ["ws", ws, "team", "invitations"],
    queryFn: teamApi.invitations,
    enabled: ws !== "none",
  });
}

function useInvalidateTeam() {
  const qc = useQueryClient();
  const ws = useWs();
  return () =>
    qc.invalidateQueries({ queryKey: ["ws", ws, "team"], exact: false });
}

export function useInvite() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (body: { email: string; role: MembershipRole }) =>
      teamApi.invite(body),
    onSuccess: invalidate,
  });
}

export function useRevokeInvitation() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (publicId: string) => teamApi.revokeInvitation(publicId),
    onSuccess: invalidate,
  });
}

export function useChangeRole() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({ publicId, role }: { publicId: string; role: MembershipRole }) =>
      teamApi.changeRole(publicId, role),
    onSuccess: invalidate,
  });
}

export function useRemoveMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (publicId: string) => teamApi.removeMember(publicId),
    onSuccess: invalidate,
  });
}
