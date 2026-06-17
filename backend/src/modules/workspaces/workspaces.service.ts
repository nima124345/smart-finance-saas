import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BUSINESS_DEFAULT_CATEGORIES } from '../categories/business-categories';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

/**
 * จัดการ workspace ของ user (ข้าม workspace — ไม่ scope ด้วย WorkspaceGuard)
 */
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  /** workspace ทั้งหมดที่ user เป็นสมาชิก + role (ใช้ hydrate หลัง login) */
  async listForUser(userId: bigint) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, workspace: { deletedAt: null } },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      publicId: m.workspace.publicId,
      name: m.workspace.name,
      type: m.workspace.type,
      baseCurrency: m.workspace.baseCurrency,
      role: m.role,
    }));
  }

  /** สร้าง workspace ใหม่ (limit check) + membership(owner) + free subscription */
  async create(userId: bigint, dto: CreateWorkspaceDto) {
    await this.subscriptions.assertCanCreateWorkspace(userId); // plan limit

    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          ownerId: userId,
          name: dto.name,
          type: dto.type,
          baseCurrency: dto.baseCurrency ?? 'THB',
        },
      });
      await tx.membership.create({
        data: { workspaceId: ws.id, userId, role: 'owner' },
      });

      // business → seed หมวดหมู่เริ่มต้นสำหรับร้าน (custom ของ workspace นี้)
      if (ws.type === 'business') {
        await tx.category.createMany({
          data: BUSINESS_DEFAULT_CATEGORIES.map((c, i) => ({
            workspaceId: ws.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
            color: c.color,
            isSystem: false,
            sortOrder: i,
          })),
        });
      }

      await this.subscriptions.createFree(tx, ws.id);
      return ws;
    });

    return {
      publicId: workspace.publicId,
      name: workspace.name,
      type: workspace.type,
      baseCurrency: workspace.baseCurrency,
      role: 'owner',
    };
  }

  async findOne(userId: bigint, publicId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, workspace: { publicId, deletedAt: null } },
      include: { workspace: true },
    });
    if (!membership) throw new NotFoundException('ไม่พบ workspace');
    const w = membership.workspace;
    return {
      publicId: w.publicId,
      name: w.name,
      type: w.type,
      baseCurrency: w.baseCurrency,
      role: membership.role,
    };
  }

  async remove(userId: bigint, publicId: string) {
    const ws = await this.prisma.workspace.findFirst({
      where: { ownerId: userId, publicId, deletedAt: null },
      select: { id: true },
    });
    if (!ws) throw new NotFoundException('ไม่พบ workspace (หรือไม่ใช่เจ้าของ)');
    await this.prisma.workspace.update({
      where: { id: ws.id },
      data: { deletedAt: new Date() },
    });
  }
}
