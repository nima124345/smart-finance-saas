import {
  FilePlus,
  FilePen,
  FileX,
  FileCheck,
  UserPlus,
  UserCheck,
  UserCog,
  UserMinus,
  MailX,
  Activity as ActivityIcon,
  type LucideIcon,
} from "lucide-react";

interface ActionMeta {
  label: string;
  icon: LucideIcon;
  tone: "income" | "expense" | "transfer" | "muted";
}

const MAP: Record<string, ActionMeta> = {
  "transaction.create": { label: "สร้างรายการ", icon: FilePlus, tone: "income" },
  "transaction.update": { label: "แก้ไขรายการ", icon: FilePen, tone: "transfer" },
  "transaction.delete": { label: "ลบรายการ", icon: FileX, tone: "expense" },
  "transaction.restore": { label: "กู้คืนรายการ", icon: FileCheck, tone: "income" },
  "member.invite": { label: "เชิญสมาชิก", icon: UserPlus, tone: "transfer" },
  "member.join": { label: "เข้าร่วมทีม", icon: UserCheck, tone: "income" },
  "member.role_change": { label: "เปลี่ยนบทบาท", icon: UserCog, tone: "transfer" },
  "member.remove": { label: "ลบสมาชิก", icon: UserMinus, tone: "expense" },
  "invitation.revoke": { label: "ยกเลิกคำเชิญ", icon: MailX, tone: "muted" },
};

export function actionMeta(action: string): ActionMeta {
  return MAP[action] ?? { label: action, icon: ActivityIcon, tone: "muted" };
}

export const TONE_CLASS: Record<ActionMeta["tone"], string> = {
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
  transfer: "bg-transfer/10 text-transfer",
  muted: "bg-muted text-muted-foreground",
};
