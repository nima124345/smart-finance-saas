import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  CreditCard,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** จำกัดเฉพาะ system admin */
  adminOnly?: boolean;
}

/** เมนูหลักใน dashboard sidebar */
export const mainNav: NavItem[] = [
  { label: "ภาพรวม", href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "กระเป๋าเงิน", href: ROUTES.wallets, icon: Wallet },
  { label: "รายการ", href: ROUTES.transactions, icon: ArrowLeftRight },
  { label: "หมวดหมู่", href: ROUTES.categories, icon: Tags },
  { label: "แพ็กเกจ", href: ROUTES.subscriptions, icon: CreditCard },
  { label: "ตั้งค่า", href: ROUTES.settings, icon: Settings },
];

/** เมนู admin (แสดงเมื่อ systemRole = admin) */
export const adminNav: NavItem[] = [
  { label: "Admin", href: ROUTES.admin, icon: Shield, adminOnly: true },
];
