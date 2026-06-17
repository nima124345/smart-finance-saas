"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { actionMeta, TONE_CLASS } from "../activity-format";
import { useActivityFeed } from "../hooks/use-business";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "ทุกกิจกรรม" },
  { value: "transaction.create", label: "สร้างรายการ" },
  { value: "transaction.update", label: "แก้ไขรายการ" },
  { value: "transaction.delete", label: "ลบรายการ" },
  { value: "member.invite", label: "เชิญสมาชิก" },
  { value: "member.join", label: "เข้าร่วมทีม" },
  { value: "member.role_change", label: "เปลี่ยนบทบาท" },
  { value: "member.remove", label: "ลบสมาชิก" },
];

export function ActivityView() {
  const [action, setAction] = useState("");
  const feed = useActivityFeed(action || undefined);

  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader
        title="Activity Log"
        description="ติดตามว่าใครทำอะไรใน workspace นี้"
        action={
          <div className="w-44">
            <Select value={action} onChange={(e) => setAction(e.target.value)}>
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <Card>
        <CardContent className="p-5">
          {feed.isLoading ? (
            <LoadingState rows={5} />
          ) : feed.isError ? (
            <ErrorState onRetry={() => feed.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState title="ยังไม่มีกิจกรรม" description="กิจกรรมของทีมจะปรากฏที่นี่" />
          ) : (
            <>
              <ol className="relative space-y-5 border-l pl-6">
                {items.map((a) => {
                  const meta = actionMeta(a.action);
                  const Icon = meta.icon;
                  return (
                    <li key={a.id} className="relative">
                      <span
                        className={`absolute -left-[2.1rem] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background ${TONE_CLASS[meta.tone]}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-wrap items-baseline justify-between gap-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {a.actor?.name ?? "ระบบ"}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {meta.label}
                          </span>
                          {typeof a.metadata?.amount === "string" && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {Number(a.metadata.amount) / 100} ฿
                            </span>
                          )}
                        </p>
                        <time className="text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      {a.actor?.email && (
                        <p className="text-xs text-muted-foreground">
                          {a.actor.email}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>

              {feed.hasNextPage && (
                <div className="mt-5 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feed.isFetchingNextPage}
                    onClick={() => feed.fetchNextPage()}
                  >
                    {feed.isFetchingNextPage ? "กำลังโหลด..." : "โหลดเพิ่ม"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
