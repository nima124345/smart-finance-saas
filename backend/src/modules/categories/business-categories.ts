import { CategoryType } from '@prisma/client';

/**
 * หมวดหมู่เริ่มต้นสำหรับ workspace แบบ business
 * สร้างเป็น custom category (workspaceId = ของร้าน, isSystem=false) ตอนสร้าง workspace
 * อ้างอิงสเปค: Sales / Inventory / Rent / Utilities / Salary / Marketing / Equipment / Logistics / Tax
 */
export interface BusinessCategorySeed {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export const BUSINESS_DEFAULT_CATEGORIES: BusinessCategorySeed[] = [
  { name: 'ยอดขาย', type: CategoryType.income, icon: 'trending-up', color: '#16a34a' },
  { name: 'วัตถุดิบ/สต๊อก', type: CategoryType.expense, icon: 'package', color: '#ea580c' },
  { name: 'ค่าเช่า', type: CategoryType.expense, icon: 'building', color: '#7c3aed' },
  { name: 'ค่าน้ำค่าไฟ', type: CategoryType.expense, icon: 'zap', color: '#0891b2' },
  { name: 'เงินเดือนพนักงาน', type: CategoryType.expense, icon: 'users', color: '#dc2626' },
  { name: 'การตลาด', type: CategoryType.expense, icon: 'megaphone', color: '#db2777' },
  { name: 'อุปกรณ์', type: CategoryType.expense, icon: 'wrench', color: '#4f46e5' },
  { name: 'ขนส่ง/โลจิสติกส์', type: CategoryType.expense, icon: 'truck', color: '#0d9488' },
  { name: 'ภาษี', type: CategoryType.expense, icon: 'receipt', color: '#64748b' },
];
