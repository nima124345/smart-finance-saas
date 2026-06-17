"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Check, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/axios";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { WorkspaceType } from "@/types/domain";
import { useCreateWorkspace } from "../hooks/use-workspaces";

const INDUSTRIES = [
  "ร้านอาหาร / คาเฟ่",
  "ค้าปลีก / ร้านค้า",
  "บริการ",
  "ออนไลน์ / อีคอมเมิร์ซ",
  "ผลิต / โรงงาน",
  "อื่นๆ",
];

function TypeCard({
  active,
  icon,
  title,
  description,
  bullets,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-xl border-2 p-5 text-left transition-all hover:border-primary/60",
        active ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-base font-semibold">{title}</span>
      <span className="mt-1 text-sm text-muted-foreground">{description}</span>
      <ul className="mt-3 space-y-1">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-income" /> {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const create = useCreateWorkspace();
  const [type, setType] = useState<WorkspaceType | null>(null);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);

  const submit = () => {
    if (!type) return;
    const wsName =
      name.trim() || (type === "business" ? "ธุรกิจของฉัน" : "ส่วนตัว");
    create.mutate(
      { name: wsName, type },
      {
        onSuccess: () =>
          router.push(type === "business" ? ROUTES.business : ROUTES.dashboard),
      },
    );
  };

  // ── Step 1: เลือกประเภท ──
  if (!type) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            คุณต้องการใช้งานแบบใด?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            เลือกประเภท Workspace — เปลี่ยน/เพิ่มภายหลังได้
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TypeCard
            active={false}
            icon={<User className="h-5 w-5" />}
            title="ใช้ส่วนตัว"
            description="จัดการรายรับรายจ่ายส่วนบุคคล"
            bullets={["บันทึกรายรับ-รายจ่าย", "หลายกระเป๋าเงิน", "Dashboard สรุปการเงิน"]}
            onClick={() => setType("personal")}
          />
          <TypeCard
            active={false}
            icon={<Building2 className="h-5 w-5" />}
            title="ใช้สำหรับธุรกิจ"
            description="จัดการการเงินร้านค้าและทีมงาน"
            bullets={[
              "ทุกอย่างใน Personal",
              "จัดการทีม + สิทธิ์พนักงาน",
              "รายงานธุรกิจ + AI Insights",
            ]}
            onClick={() => setType("business")}
          />
        </div>
      </div>
    );
  }

  // ── Step 2: รายละเอียด ──
  return (
    <div className="mx-auto max-w-md">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3"
        onClick={() => setType(null)}
      >
        <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
      </Button>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            {type === "business" ? (
              <Building2 className="h-5 w-5 text-primary" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold">
              {type === "business" ? "ตั้งค่าธุรกิจ" : "Workspace ส่วนตัว"}
            </h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-name">
              {type === "business" ? "ชื่อธุรกิจ / ร้าน" : "ชื่อ Workspace"}
            </Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "business" ? "เช่น ร้านกาแฟสุขใจ" : "ส่วนตัว"}
            />
          </div>

          {type === "business" && (
            <div className="space-y-1.5">
              <Label>ประเภทธุรกิจ</Label>
              <Select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                ระบบจะสร้างหมวดหมู่ธุรกิจเริ่มต้นให้อัตโนมัติ (ยอดขาย วัตถุดิบ ค่าเช่า ฯลฯ)
              </p>
            </div>
          )}

          {create.isError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(create.error)}
            </p>
          )}

          <Button className="w-full" onClick={submit} disabled={create.isPending}>
            {create.isPending
              ? "กำลังสร้าง..."
              : type === "business"
                ? "สร้าง Workspace ธุรกิจ"
                : "สร้าง Workspace"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
