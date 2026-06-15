"use client";

import Link from "next/link";
import { ArrowRight, PlusCircle, Sparkles, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Empty onboarding — แสดงเมื่อยังไม่มี transaction */
export function DashboardOnboarding() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">เริ่มต้นใช้งาน Smart Finance</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            บันทึกรายรับรายจ่ายครั้งแรก แล้วดู dashboard ของคุณมีชีวิตขึ้นมา
          </p>
        </div>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">1. สร้างกระเป๋าเงิน</p>
              <p className="text-xs text-muted-foreground">เงินสด ธนาคาร หรือพร้อมเพย์</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/wallets">
                ไปที่กระเป๋า <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <PlusCircle className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">2. บันทึกรายการแรก</p>
              <p className="text-xs text-muted-foreground">รายรับหรือรายจ่ายก็ได้</p>
            </div>
            <Button asChild size="sm">
              <Link href="/transactions">
                เพิ่มรายการ <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
