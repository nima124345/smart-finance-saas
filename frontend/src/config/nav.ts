import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  CreditCard,
  Settings,
  Building2,
  FileBarChart,
  Users,
  History,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";
import type { MembershipRole, WorkspaceType } from "@/types/domain";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** จำกัดเฉพาะ role เหล่านี้ (undefined = ทุก role) */
  roles?: MembershipRole[];
  /** แสดงเฉพาะ workspace ประเภทนี้ (undefined = ทุกประเภท) */
  type?: WorkspaceType;
}

const MANAGERS: MembershipRole[] = ["owner", "admin"];

/** เมนูทั้งหมด (กรองตาม type + role ภายหลัง) */
const ALL_NAV: NavItem[] = [
  { label: "ภาพรวม", href: ROUTES.dashboard, icon: LayoutDashboard },
  {
    label: "แดชบอร์ดธุรกิจ",
    href: ROUTES.business,
    icon: Building2,
    type: "business",
    roles: MANAGERS,
  },
  { label: "รายการ", href: ROUTES.transactions, icon: ArrowLeftRight },
  { label: "กระเป๋าเงิน", href: ROUTES.wallets, icon: Wallet },
  { label: "หมวดหมู่", href: ROUTES.categories, icon: Tags },
  {
    label: "รายงาน",
    href: ROUTES.reports,
    icon: FileBarChart,
    type: "business",
    roles: MANAGERS,
  },
  {
    label: "AI Insights",
    href: ROUTES.insights,
    icon: Sparkles,
    type: "business",
    roles: MANAGERS,
  },
  {
    label: "ทีมงาน",
    href: ROUTES.team,
    icon: Users,
    type: "business",
  },
  {
    label: "Activity",
    href: ROUTES.activity,
    icon: History,
    type: "business",
    roles: MANAGERS,
  },
  { label: "แพ็กเกจ", href: ROUTES.subscriptions, icon: CreditCard, roles: MANAGERS },
  { label: "ตั้งค่า", href: ROUTES.settings, icon: Settings },
];

/** สร้างเมนู sidebar ตามประเภท workspace + role ของผู้ใช้ปัจจุบัน */
export function buildNav(
  type: WorkspaceType | undefined,
  role: MembershipRole | undefined,
): NavItem[] {
  return ALL_NAV.filter((item) => {
    if (item.type && item.type !== type) return false;
    if (item.roles && (!role || !item.roles.includes(role))) return false;
    return true;
  });
}
