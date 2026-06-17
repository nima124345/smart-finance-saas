import { ROLE_LABELS, roleHasPermission } from './permissions';

describe('permissions matrix', () => {
  it('Owner มีสิทธิ์ทุกอย่าง รวม workspace/billing', () => {
    expect(roleHasPermission('owner', 'workspace.manage')).toBe(true);
    expect(roleHasPermission('owner', 'billing.manage')).toBe(true);
    expect(roleHasPermission('owner', 'ai.insights.view')).toBe(true);
  });

  it('Manager (admin) จัดการทีม/รายงานได้ แต่ไม่มี workspace/billing', () => {
    expect(roleHasPermission('admin', 'team.manage')).toBe(true);
    expect(roleHasPermission('admin', 'report.view')).toBe(true);
    expect(roleHasPermission('admin', 'dashboard.business.view')).toBe(true);
    expect(roleHasPermission('admin', 'workspace.manage')).toBe(false);
    expect(roleHasPermission('admin', 'billing.manage')).toBe(false);
  });

  it('Staff (member) สร้างรายการ + ดูทีม แต่จัดการอื่นไม่ได้', () => {
    expect(roleHasPermission('member', 'transaction.create')).toBe(true);
    expect(roleHasPermission('member', 'team.view')).toBe(true);
    expect(roleHasPermission('member', 'team.manage')).toBe(false);
    expect(roleHasPermission('member', 'report.view')).toBe(false);
    expect(roleHasPermission('member', 'transaction.delete.any')).toBe(false);
  });

  it('ป้ายชื่อ role map ถูกต้อง', () => {
    expect(ROLE_LABELS.owner).toBe('Owner');
    expect(ROLE_LABELS.admin).toBe('Manager');
    expect(ROLE_LABELS.member).toBe('Staff');
  });
});
