import { randomBytes } from 'crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PlanCode, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TokenService } from '../../auth/token.service';
import { AuditService } from '../audit.service';

interface UserQuery {
  page: number;
  perPage: number;
  search?: string;
  plan?: PlanCode;
  status?: 'active' | 'suspended';
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async list(q: UserQuery) {
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (q.search) {
      where.OR = [
        { email: { contains: q.search, mode: 'insensitive' } },
        { name: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.status === 'suspended') where.suspendedAt = { not: null };
    if (q.status === 'active') where.suspendedAt = null;
    if (q.plan) {
      where.ownedWorkspaces = {
        some: {
          deletedAt: null,
          subscriptions: {
            some: {
              status: { in: ['active', 'trialing'] },
              plan: { code: q.plan },
            },
          },
        },
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.perPage,
        take: q.perPage,
        include: {
          ownedWorkspaces: {
            where: { deletedAt: null },
            select: {
              id: true,
              subscriptions: {
                where: { status: { in: ['active', 'trialing'] } },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { plan: { select: { code: true } } },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const rank: Record<string, number> = { free: 0, pro: 1, premium: 2 };
    const items = rows.map((u) => {
      // plan สูงสุดในบรรดา workspace ของ user
      let plan = 'free';
      for (const w of u.ownedWorkspaces) {
        const code = w.subscriptions[0]?.plan.code ?? 'free';
        if ((rank[code] ?? 0) > (rank[plan] ?? 0)) plan = code;
      }
      return {
        publicId: u.publicId,
        name: u.name,
        email: u.email,
        systemRole: u.systemRole,
        plan,
        status: u.suspendedAt ? 'suspended' : 'active',
        workspaceCount: u.ownedWorkspaces.length,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return { items, page: q.page, perPage: q.perPage, total };
  }

  private async findUserOr404(publicId: string) {
    const user = await this.prisma.user.findFirst({
      where: { publicId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
    return user;
  }

  async suspend(actorId: bigint, publicId: string) {
    const user = await this.findUserOr404(publicId);
    if (user.systemRole === 'admin') {
      throw new BadRequestException('ระงับบัญชีผู้ดูแลไม่ได้');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { suspendedAt: new Date() },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await this.audit.log({ actorId, action: 'user.suspend', targetType: 'user', targetId: publicId });
    return { status: 'suspended' };
  }

  async activate(actorId: bigint, publicId: string) {
    const user = await this.findUserOr404(publicId);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { suspendedAt: null },
    });
    await this.audit.log({ actorId, action: 'user.activate', targetType: 'user', targetId: publicId });
    return { status: 'active' };
  }

  async resetPassword(actorId: bigint, publicId: string) {
    const user = await this.findUserOr404(publicId);
    const tempPassword = randomBytes(6).toString('base64url'); // ~8 ตัว
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await argon2.hash(tempPassword, { type: argon2.argon2id }) },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await this.audit.log({ actorId, action: 'user.reset_password', targetType: 'user', targetId: publicId });
    // คืน temp password ครั้งเดียว (admin แจ้งผู้ใช้)
    return { tempPassword };
  }

  async changePlan(actorId: bigint, publicId: string, plan: PlanCode) {
    const user = await this.findUserOr404(publicId);
    const ws = await this.prisma.workspace.findFirst({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!ws) throw new BadRequestException('ผู้ใช้ไม่มี workspace');
    await this.subscriptions.changePlan(ws.id, { plan });
    await this.audit.log({
      actorId,
      action: 'user.change_plan',
      targetType: 'user',
      targetId: publicId,
      metadata: { plan },
    });
    return { plan };
  }

  /** impersonate — ออก tenant access token ของ user เป้าหมาย (audit log) */
  async impersonate(actorId: bigint, publicId: string) {
    const user = await this.findUserOr404(publicId);
    if (user.suspendedAt) throw new BadRequestException('บัญชีถูกระงับ');
    const ws = await this.prisma.workspace.findFirst({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { publicId: true },
    });
    const { accessToken } = await this.tokens.issueTokens(user);
    await this.audit.log({
      actorId,
      action: 'user.impersonate',
      targetType: 'user',
      targetId: publicId,
    });
    return {
      accessToken,
      user: { publicId: user.publicId, name: user.name, email: user.email, systemRole: user.systemRole },
      workspacePublicId: ws?.publicId ?? null,
    };
  }

  async remove(actorId: bigint, publicId: string) {
    const user = await this.findUserOr404(publicId);
    if (user.systemRole === 'admin') {
      throw new BadRequestException('ลบบัญชีผู้ดูแลไม่ได้');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await this.audit.log({ actorId, action: 'user.delete', targetType: 'user', targetId: publicId });
    return { deleted: true };
  }
}
