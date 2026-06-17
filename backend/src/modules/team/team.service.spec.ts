import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ActivityService } from '../activity/activity.service';
import { TeamService } from './team.service';

describe('TeamService role rules', () => {
  let prisma: any;
  let subscriptions: jest.Mocked<Pick<SubscriptionsService, 'assertCanInviteMember'>>;
  let activity: jest.Mocked<Pick<ActivityService, 'log'>>;
  let config: jest.Mocked<Pick<ConfigService, 'get'>>;
  let service: TeamService;

  beforeEach(() => {
    prisma = {
      membership: { findFirst: jest.fn(), findUnique: jest.fn() },
      workspaceInvitation: { findFirst: jest.fn(), create: jest.fn() },
    };
    subscriptions = { assertCanInviteMember: jest.fn().mockResolvedValue(undefined) };
    activity = { log: jest.fn().mockResolvedValue(undefined) };
    config = {
      get: jest.fn((key: string) =>
        key === 'app.frontendUrl' ? 'http://localhost:3000' : 'test',
      ) as any,
    };
    service = new TeamService(
      prisma as PrismaService,
      subscriptions as unknown as SubscriptionsService,
      activity as unknown as ActivityService,
      config as unknown as ConfigService,
    );
  });

  describe('invite', () => {
    it('เชิญเป็น Owner ไม่ได้', async () => {
      await expect(
        service.invite(1n, { userId: 1n, role: 'owner' }, {
          email: 'a@b.com',
          role: 'owner',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('Manager เชิญเป็น Manager (admin) ไม่ได้', async () => {
      await expect(
        service.invite(1n, { userId: 1n, role: 'admin' }, {
          email: 'a@b.com',
          role: 'admin',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Owner เชิญ Staff สำเร็จ → สร้าง invitation + log', async () => {
      prisma.membership.findFirst.mockResolvedValue(null);
      prisma.workspaceInvitation.findFirst.mockResolvedValue(null);
      prisma.workspaceInvitation.create.mockResolvedValue({
        publicId: 'inv1',
        email: 'a@b.com',
        role: 'member',
        expiresAt: new Date('2026-07-01T00:00:00.000Z'),
      });

      const res = await service.invite(1n, { userId: 1n, role: 'owner' }, {
        email: 'A@B.com',
        role: 'member',
      });

      expect(subscriptions.assertCanInviteMember).toHaveBeenCalledWith(1n);
      expect(prisma.workspaceInvitation.create).toHaveBeenCalled();
      // email ถูก normalize เป็น lowercase
      expect(prisma.workspaceInvitation.create.mock.calls[0][0].data.email).toBe(
        'a@b.com',
      );
      expect(activity.log).toHaveBeenCalled();
      expect(res.roleLabel).toBe('Staff');
    });

    it('เชิญซ้ำอีเมลที่เป็นสมาชิกอยู่แล้ว → conflict', async () => {
      prisma.membership.findFirst.mockResolvedValue({ id: 9n });
      await expect(
        service.invite(1n, { userId: 1n, role: 'owner' }, {
          email: 'a@b.com',
          role: 'member',
        }),
      ).rejects.toThrow(/สมาชิกอยู่แล้ว/);
    });
  });

  describe('changeRole', () => {
    it('ไม่ใช่ Owner → ห้ามเปลี่ยน role', async () => {
      await expect(
        service.changeRole(1n, { userId: 1n, role: 'admin' }, 'target', {
          role: 'member',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('Manager ลบ Manager ด้วยกันไม่ได้', async () => {
      prisma.membership.findFirst.mockResolvedValue({
        id: 5n,
        role: 'admin',
        userId: 99n,
      });
      await expect(
        service.removeMember(1n, { userId: 1n, role: 'admin' }, 'target'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ลบ Owner ไม่ได้', async () => {
      prisma.membership.findFirst.mockResolvedValue({
        id: 5n,
        role: 'owner',
        userId: 99n,
      });
      await expect(
        service.removeMember(1n, { userId: 1n, role: 'owner' }, 'target'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
