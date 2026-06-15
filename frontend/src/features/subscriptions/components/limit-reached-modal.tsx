"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUiStore } from "@/stores/ui-store";

/** Modal แจ้งเตือนเมื่อชน plan limit (เปิดจาก axios interceptor ทั่วระบบ) */
export function LimitReachedModal() {
  const message = useUiStore((s) => s.limitReachedMessage);
  const setLimit = useUiStore((s) => s.setLimitReached);

  return (
    <Dialog open={!!message} onOpenChange={(o) => !o && setLimit(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">ถึงขีดจำกัดของแพ็กเกจ</DialogTitle>
        </DialogHeader>
        <p className="text-center text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setLimit(null)}
          >
            ปิด
          </Button>
          <Button asChild className="flex-1">
            <Link href="/subscriptions" onClick={() => setLimit(null)}>
              อัปเกรดแพ็กเกจ
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
