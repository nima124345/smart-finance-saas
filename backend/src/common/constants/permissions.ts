import { MembershipRole } from '@prisma/client';

/**
 * Permission matrix สำหรับ workspace (โดยเฉพาะ business)
 * map membership role (DB) → ป้ายชื่อธุรกิจ + ชุดสิทธิ์
 *   owner  → Owner   (เจ้าของ)
 *   admin  → Manager (ผู้จัดการ)
 *   member → Staff   (พนักงาน)
 *
 * ใช้คู่กับ PermissionGuard ผ่าน @RequirePermission(...).
 * สิทธิ์ระดับ "ของตัวเอง" (เช่น Staff แก้รายการของตัวเอง) เช็คใน service (row-level) ไม่ใช่ guard.
 */
export type Permission =
  | 'workspace.manage' // เปลี่ยนชื่อ/ลบ/ตั้งค่า workspace
  | 'billing.manage' // เปลี่ยนแพ็กเกจ / ชำระเงิน
  | 'team.view' // ดูรายชื่อสมาชิก
  | 'team.manage' // เชิญ/ลบ/เปลี่ยน role สมาชิก
  | 'wallet.manage' // สร้าง/แก้/ลบ กระเป๋าเงิน
  | 'category.manage' // สร้าง/ลบ หมวดหมู่
  | 'transaction.create' // สร้างรายการ
  | 'transaction.update.any' // แก้รายการของใครก็ได้
  | 'transaction.delete.any' // ลบรายการของใครก็ได้
  | 'report.view' // ดู/ส่งออก รายงานธุรกิจ
  | 'dashboard.business.view' // ดู Business Dashboard
  | 'activity.view' // ดู Staff Activity Log
  | 'ai.insights.view'; // ดู AI Insights

const ALL_PERMISSIONS: Permission[] = [
  'workspace.manage',
  'billing.manage',
  'team.view',
  'team.manage',
  'wallet.manage',
  'category.manage',
  'transaction.create',
  'transaction.update.any',
  'transaction.delete.any',
  'report.view',
  'dashboard.business.view',
  'activity.view',
  'ai.insights.view',
];

// Manager = ทุกอย่างยกเว้นจัดการ workspace/billing (นั่นคือสิทธิ์ของ Owner เท่านั้น)
const MANAGER_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => p !== 'workspace.manage' && p !== 'billing.manage',
);

// Staff = สร้างรายการ + ดูทีม (แก้/ลบเฉพาะของตัวเอง → เช็คใน service)
const STAFF_PERMISSIONS: Permission[] = ['transaction.create', 'team.view'];

export const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: MANAGER_PERMISSIONS,
  member: STAFF_PERMISSIONS,
};

/** ป้ายชื่อธุรกิจของแต่ละ role (สำหรับแสดงผล/รายงาน) */
export const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: 'Owner',
  admin: 'Manager',
  member: 'Staff',
};

/** role นี้มีสิทธิ์ perm ไหม */
export function roleHasPermission(
  role: MembershipRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
