import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionGuard } from './permission.guard';
import { BusinessGuard } from './business.guard';
import { Permission } from '../constants/permissions';

function mockCtx(workspace: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ workspace }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('PermissionGuard', () => {
  const make = (required: Permission[]) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new PermissionGuard(reflector);
  };

  it('ผ่านเมื่อ role มี permission ครบ', () => {
    const guard = make(['report.view']);
    expect(guard.canActivate(mockCtx({ role: 'admin', type: 'business' }))).toBe(
      true,
    );
  });

  it('บล็อกเมื่อ role ไม่มี permission', () => {
    const guard = make(['billing.manage']);
    expect(() =>
      guard.canActivate(mockCtx({ role: 'admin', type: 'business' })),
    ).toThrow(ForbiddenException);
  });

  it('ไม่มี metadata → อนุญาต (route ไม่ได้ gate)', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);
    expect(guard.canActivate(mockCtx({ role: 'member' }))).toBe(true);
  });
});

describe('BusinessGuard', () => {
  const guard = new BusinessGuard();

  it('ผ่านเมื่อ workspace เป็น business', () => {
    expect(guard.canActivate(mockCtx({ type: 'business', role: 'owner' }))).toBe(
      true,
    );
  });

  it('บล็อก workspace แบบ personal', () => {
    expect(() =>
      guard.canActivate(mockCtx({ type: 'personal', role: 'owner' })),
    ).toThrow(ForbiddenException);
  });
});
