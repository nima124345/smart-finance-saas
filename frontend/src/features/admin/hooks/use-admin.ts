"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../api/admin.api";

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.dashboard });
}

export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => adminApi.users(page),
  });
}
