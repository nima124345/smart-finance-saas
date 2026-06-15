import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** เมนูหลักใน dashboard sidebar (ฝั่งผู้เช่า) — Admin อยู่ที่ /admin portal แยกต่างหาก */
export const mainNav: NavItem[] = [
  { label: "ภาพรวม", href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "กระเป๋าเงิน", href: ROUTES.wallets, icon: Wallet },
  { label: "รายการ", href: ROUTES.transactions, icon: ArrowLeftRight },
  { label: "หมวดหมู่", href: ROUTES.categories, icon: Tags },
  { label: "แพ็กเกจ", href: ROUTES.subscriptions, icon: CreditCard },
  { label: "ตั้งค่า", href: ROUTES.settings, icon: Settings },
];
