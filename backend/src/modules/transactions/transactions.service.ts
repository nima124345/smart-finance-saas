import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  QueryTransactionDto,
  TransactionSort,
} from './dto/query-transaction.dto';

const TX_INCLUDE = {
  wallet: { select: { publicId: true, name: true } },
  destinationWallet: { select: { publicId: true, name: true } },
  category: { select: { publicId: true, name: true } },
} satisfies Prisma.TransactionInclude;

type TxWithRelations = Prisma.TransactionGetPayload<{ include: typeof TX_INCLUDE }>;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // ── helpers ────────────────────────────────────────────────
  private map(t: TxWithRelations) {
    return {
      publicId: t.publicId,
      type: t.type,
      amount: t.amount.toString(),
      currency: t.currency,
      note: t.note,
      transactionDate: t.transactionDate.toISOString().slice(0, 10),
      wallet: t.wallet,
      destinationWallet: t.destinationWallet,
      category: t.category,
      createdAt: t.createdAt,
    };
  }

  /** resolve wallet publicId → internal id (scope workspace = กัน cross-tenant) */
  private async resolveWalletId(
    workspaceId: bigint,
    publicId: string,
  ): Promise<bigint> {
    const wallet = await this.prisma.wallet.findFirst({
      where: { workspaceId, publicId, deletedAt: null },
      select: { id: true },
    });
    if (!wallet) throw new BadRequestException('ไม่พบกระเป๋าเงินที่ระบุ');
    return wallet.id;
  }

  /** resolve category + ตรวจ type ให้ตรงกับ transaction */
  private async resolveCategoryId(
    workspaceId: bigint,
    publicId: string,
    expectedType: TransactionType,
  ): Promise<bigint> {
    const category = await this.prisma.category.findFirst({
      where: {
        publicId,
        deletedAt: null,
        // system (null) หรือของ workspace นี้เท่านั้น
        OR: [{ workspaceId }, { workspaceId: null }],
      },
      select: { id: true, type: true },
    });
    if (!category) throw new BadRequestException('ไม่พบหมวดหมู่ที่ระบุ');
    if (category.type !== (expectedType as unknown as string)) {
      throw new BadRequestException('ชนิดหมวดหมู่ไม่ตรงกับประเภทรายการ');
    }
    return category.id;
  }

  private monthRange(month: string): { gte: Date; lt: Date } {
    const [y, m] = month.split('-').map(Number);
    const gte = new Date(Date.UTC(y, m - 1, 1));
    const lt = new Date(Date.UTC(y, m, 1));
    return { gte, lt };
  }

  private buildWhere(
    workspaceId: bigint,
    q: QueryTransactionDto,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      workspaceId,
      deletedAt: null,
    };
    if (q.type) where.type = q.type;
    if (q.search) where.note = { contains: q.search, mode: 'insensitive' };

    if (q.walletId) {
      where.OR = [
        { wallet: { publicId: q.walletId } },
        { destinationWallet: { publicId: q.walletId } },
      ];
    }
    if (q.categoryId) where.category = { publicId: q.categoryId };

    // date filter: month มาก่อน ถ้าไม่มีใช้ dateFrom/dateTo
    const date: Prisma.DateTimeFilter = {};
    if (q.month) Object.assign(date, this.monthRange(q.month));
    if (q.dateFrom) date.gte = new Date(`${q.dateFrom}T00:00:00.000Z`);
    if (q.dateTo) date.lte = new Date(`${q.dateTo}T00:00:00.000Z`);
    if (Object.keys(date).length) where.transactionDate = date;

    const amount: Prisma.BigIntFilter = {};
    if (q.amountMin != null) amount.gte = BigInt(q.amountMin);
    if (q.amountMax != null) amount.lte = BigInt(q.amountMax);
    if (Object.keys(amount).length) where.amount = amount;

    return where;
  }

  private orderBy(
    sort: TransactionSort,
  ): Prisma.TransactionOrderByWithRelationInput[] {
    switch (sort) {
      case TransactionSort.Oldest:
        return [{ transactionDate: 'asc' }, { id: 'asc' }];
      case TransactionSort.AmountHigh:
        return [{ amount: 'desc' }, { id: 'desc' }];
      case TransactionSort.AmountLow:
        return [{ amount: 'asc' }, { id: 'asc' }];
      case TransactionSort.Latest:
      default:
        return [{ transactionDate: 'desc' }, { id: 'desc' }];
    }
  }

  // ── LIST (cursor pagination) ───────────────────────────────
  async list(workspaceId: bigint, q: QueryTransactionDto) {
    let cursorId: bigint | undefined;
    if (q.cursor) {
      const c = await this.prisma.transaction.findFirst({
        where: { workspaceId, publicId: q.cursor },
        select: { id: true },
      });
      cursorId = c?.id;
    }

    const rows = await this.prisma.transaction.findMany({
      where: this.buildWhere(workspaceId, q),
      include: TX_INCLUDE,
      orderBy: this.orderBy(q.sort),
      take: q.limit + 1, // +1 เพื่อรู้ว่ามีหน้าถัดไปไหม
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });

    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].publicId : null;

    return { items: items.map((t) => this.map(t)), nextCursor };
  }

  // ── DETAIL ─────────────────────────────────────────────────
  async findOne(workspaceId: bigint, publicId: string) {
    const t = await this.prisma.transaction.findFirst({
      where: { workspaceId, publicId, deletedAt: null },
      include: TX_INCLUDE,
    });
    if (!t) throw new NotFoundException('ไม่พบรายการ');
    return this.map(t);
  }

  // ── CREATE ─────────────────────────────────────────────────
  async create(workspaceId: bigint, userId: bigint, dto: CreateTransactionDto) {
    await this.subscriptions.assertCanCreateTransaction(workspaceId); // plan limit
    const walletId = await this.resolveWalletId(workspaceId, dto.walletId);

    const data: Prisma.TransactionCreateInput = {
      // publicId: gen โดย DB (default)
      workspace: { connect: { id: workspaceId } },
      wallet: { connect: { id: walletId } },
      createdBy: { connect: { id: userId } },
      type: dto.type,
      amount: BigInt(dto.amount),
      note: dto.note,
      transactionDate: new Date(`${dto.transactionDate}T00:00:00.000Z`),
    };

    if (dto.type === TransactionType.transfer) {
      if (!dto.destinationWalletId) {
        throw new BadRequestException('การโอนต้องระบุกระเป๋าปลายทาง');
      }
      if (dto.destinationWalletId === dto.walletId) {
        throw new BadRequestException('โอนเข้ากระเป๋าเดียวกันไม่ได้');
      }
      const destId = await this.resolveWalletId(
        workspaceId,
        dto.destinationWalletId,
      );
      data.destinationWallet = { connect: { id: destId } };
      // transfer ไม่มี category
    } else {
      if (!dto.categoryId) {
        throw new BadRequestException('รายรับ/รายจ่ายต้องระบุหมวดหมู่');
      }
      const categoryId = await this.resolveCategoryId(
        workspaceId,
        dto.categoryId,
        dto.type,
      );
      data.category = { connect: { id: categoryId } };
    }

    const created = await this.prisma.transaction.create({
      data,
      include: TX_INCLUDE,
    });
    return this.map(created);
  }

  // ── UPDATE (type เปลี่ยนไม่ได้) ────────────────────────────
  async update(
    workspaceId: bigint,
    publicId: string,
    dto: UpdateTransactionDto,
  ) {
    const existing = await this.prisma.transaction.findFirst({
      where: { workspaceId, publicId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('ไม่พบรายการ');

    const data: Prisma.TransactionUpdateInput = {};
    if (dto.amount != null) data.amount = BigInt(dto.amount);
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.transactionDate) {
      data.transactionDate = new Date(`${dto.transactionDate}T00:00:00.000Z`);
    }
    if (dto.walletId) {
      const wid = await this.resolveWalletId(workspaceId, dto.walletId);
      data.wallet = { connect: { id: wid } };
    }

    if (existing.type === TransactionType.transfer) {
      if (dto.destinationWalletId) {
        const did = await this.resolveWalletId(
          workspaceId,
          dto.destinationWalletId,
        );
        data.destinationWallet = { connect: { id: did } };
      }
    } else if (dto.categoryId) {
      const cid = await this.resolveCategoryId(
        workspaceId,
        dto.categoryId,
        existing.type,
      );
      data.category = { connect: { id: cid } };
    }

    const updated = await this.prisma.transaction.update({
      where: { id: existing.id },
      data,
      include: TX_INCLUDE,
    });
    return this.map(updated);
  }

  // ── SOFT DELETE / RESTORE ──────────────────────────────────
  async remove(workspaceId: bigint, publicId: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { workspaceId, publicId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('ไม่พบรายการ');
    await this.prisma.transaction.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(workspaceId: bigint, publicId: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { workspaceId, publicId, NOT: { deletedAt: null } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('ไม่พบรายการที่ถูกลบ');
    const restored = await this.prisma.transaction.update({
      where: { id: existing.id },
      data: { deletedAt: null },
      include: TX_INCLUDE,
    });
    return this.map(restored);
  }
}
