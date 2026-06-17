"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, MailQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { getApiErrorMessage } from "@/lib/api/axios";
import { ROUTES } from "@/lib/constants";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useRefreshWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { teamApi } from "../api/team.api";

export function InviteAcceptView() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const refresh = useRefreshWorkspaces();

  const preview = useQuery({
    queryKey: ["invite", token],
    queryFn: () => teamApi.preview(token),
    enabled: !!token,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => teamApi.accept(token),
    onSuccess: async (res) => {
      await refresh.mutateAsync();
      switchWorkspace(res.workspace.publicId);
      router.push(
        res.workspace.type === "business" ? ROUTES.business : ROUTES.dashboard,
      );
    },
  });

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-10">
        <ErrorState title="ลิงก์ไม่ถูกต้อง" message="ไม่พบโทเค็นคำเชิญใน URL" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-6">
      {preview.isLoading ? (
        <LoadingState rows={3} />
      ) : preview.isError || !preview.data ? (
        <ErrorState
          title="คำเชิญไม่ถูกต้อง"
          message="คำเชิญอาจหมดอายุ ถูกยกเลิก หรือออกให้อีเมลอื่น"
        />
      ) : (
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {preview.data.workspaceType === "business" ? (
                <Building2 className="h-7 w-7" />
              ) : (
                <MailQuestion className="h-7 w-7" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold">คำเชิญเข้าร่วมทีม</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {preview.data.invitedByName}
                </span>{" "}
                เชิญคุณเข้าร่วม{" "}
                <span className="font-medium text-foreground">
                  {preview.data.workspaceName}
                </span>{" "}
                ในบทบาท{" "}
                <span className="font-medium text-foreground">
                  {preview.data.roleLabel}
                </span>
              </p>
            </div>

            {accept.isError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {getApiErrorMessage(accept.error)}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(ROUTES.dashboard)}
              >
                ภายหลัง
              </Button>
              <Button
                className="flex-1"
                disabled={accept.isPending || refresh.isPending}
                onClick={() => accept.mutate()}
              >
                {accept.isPending ? "กำลังเข้าร่วม..." : "เข้าร่วมทีม"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
