import { Injectable, NotFoundException } from '@nestjs/common';
import { SupportStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../audit.service';

@Injectable()
export class AdminSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async tickets(status?: SupportStatus) {
    const rows = await this.prisma.supportTicket.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { email: true } } },
    });
    return rows.map((t) => ({
      publicId: t.publicId,
      type: t.type,
      subject: t.subject,
      message: t.message,
      email: t.email,
      user: t.user?.email ?? null,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async closeTicket(actorId: bigint, publicId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { publicId } });
    if (!ticket) throw new NotFoundException('ไม่พบ ticket');
    await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'closed' },
    });
    await this.audit.log({ actorId, action: 'support.close', targetType: 'ticket', targetId: publicId });
    return { status: 'closed' };
  }

  /** trace ผู้ใช้ — โปรไฟล์ + activity ล่าสุด */
  async traceUser(query: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: { contains: query, mode: 'insensitive' }, deletedAt: null },
      select: {
        publicId: true,
        name: true,
        email: true,
        suspendedAt: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { ownedWorkspaces: true, transactions: true } },
      },
    });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้');

    const recent = await this.prisma.transaction.findMany({
      where: { createdBy: { publicId: user.publicId }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { type: true, amount: true, transactionDate: true, note: true },
    });

    return {
      user: {
        publicId: user.publicId,
        name: user.name,
        email: user.email,
        status: user.suspendedAt ? 'suspended' : 'active',
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        workspaceCount: user._count.ownedWorkspaces,
        transactionCount: user._count.transactions,
      },
      recentActivity: recent.map((t) => ({
        type: t.type,
        amount: t.amount.toString(),
        date: t.transactionDate.toISOString().slice(0, 10),
        note: t.note,
      })),
    };
  }
}
