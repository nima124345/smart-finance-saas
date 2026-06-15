import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Wallet } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  /**
   * คำนวณ balance ทุก wallet ของ workspace (ไม่เก็บใน DB — คำนวณจาก transactions)
   * balance = initialBalance + Σincome − Σexpense − Σtransfer_out + Σtransfer_in
   */
  private async computeBalances(
    workspaceId: bigint,
  ): Promise<Map<bigint, bigint>> {
    const [byWallet, transferIn] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['walletId', 'type'],
        where: { workspaceId, deletedAt: null },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['destinationWalletId'],
        where: { workspaceId, deletedAt: null, type: 'transfer' },
        _sum: { amount: true },
      }),
    ]);

    const balances = new Map<bigint, bigint>();
    const add = (id: bigint, delta: bigint) =>
      balances.set(id, (balances.get(id) ?? 0n) + delta);

    for (const row of byWallet) {
      const amt = row._sum.amount ?? 0n;
      if (row.type === 'income') add(row.walletId, amt);
      else if (row.type === 'expense') add(row.walletId, -amt);
      else if (row.type === 'transfer') add(row.walletId, -amt); // out
    }
    for (const row of transferIn) {
      if (row.destinationWalletId) add(row.destinationWalletId, row._sum.amount ?? 0n);
    }
    return balances;
  }

  private map(w: Wallet, balance: bigint) {
    return {
      publicId: w.publicId,
      name: w.name,
      type: w.type,
      currency: w.currency,
      initialBalance: w.initialBalance.toString(),
      balance: balance.toString(),
      color: w.color,
      icon: w.icon,
      isArchived: w.isArchived,
    };
  }

  async list(workspaceId: bigint) {
    const [wallets, balances] = await Promise.all([
      this.prisma.wallet.findMany({
        where: { workspaceId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
      this.computeBalances(workspaceId),
    ]);
    return wallets.map((w) =>
      this.map(w, w.initialBalance + (balances.get(w.id) ?? 0n)),
    );
  }

  async findOne(workspaceId: bigint, publicId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { workspaceId, publicId, deletedAt: null },
    });
    if (!wallet) throw new NotFoundException('ไม่พบกระเป๋าเงิน');
    const balances = await this.computeBalances(workspaceId);
    return this.map(wallet, wallet.initialBalance + (balances.get(wallet.id) ?? 0n));
  }

  async create(workspaceId: bigint, dto: CreateWalletDto) {
    await this.subscriptions.assertCanCreateWallet(workspaceId); // plan limit
    const wallet = await this.prisma.wallet.create({
      data: {
        workspaceId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency ?? 'THB',
        initialBalance: BigInt(dto.initialBalance ?? 0),
        color: dto.color,
        icon: dto.icon,
      },
    });
    return this.map(wallet, wallet.initialBalance);
  }

  /** soft delete — RESTRICT ถ้ามี transaction (ให้ archive แทน) */
  async remove(workspaceId: bigint, publicId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { workspaceId, publicId, deletedAt: null },
      select: { id: true },
    });
    if (!wallet) throw new NotFoundException('ไม่พบกระเป๋าเงิน');

    const txnCount = await this.prisma.transaction.count({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [{ walletId: wallet.id }, { destinationWalletId: wallet.id }],
      },
    });
    if (txnCount > 0) {
      throw new BadRequestException(
        'กระเป๋านี้มีรายการอยู่ — กรุณาเก็บเข้าคลัง (archive) แทนการลบ',
      );
    }

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { deletedAt: new Date() },
    });
  }
}
