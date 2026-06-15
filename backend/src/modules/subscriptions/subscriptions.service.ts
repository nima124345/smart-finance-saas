import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Plan, PlanCode, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ChangePlanDto } from './dto/change-plan.dto';

export const TRIAL_DAYS = 14;
const PERIOD_DAYS = 30;

type PlanFeatures = {
  advancedDashboard: boolean;
  exportCsv: boolean;
  teamMembers: boolean;
  aiInsights: boolean;
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private addDays(d: Date, days: number): Date {
    return new Date(d.getTime() + days * 86400000);
  }

  private async freePlan(): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({ where: { code: 'free' } });
    if (!plan) throw new NotFoundException('ไม่พบแพ็กเกจ free (รัน seed?)');
    return plan;
  }

  private mapPlan(plan: Plan) {
    return {
      code: plan.code,
      name: plan.name,
      price: plan.price.toString(),
      maxWorkspaces: plan.maxWorkspaces,
      maxWallets: plan.maxWallets,
      maxTransactionsMonth: plan.maxTransactionsMonth,
      features: plan.features as PlanFeatures,
    };
  }

  /**
   * แพ็กเกจที่มีผลจริงของ workspace (resolve trial/expiry แบบ lazy)
   * - มี sub active/trialing ที่ยังไม่หมดอายุ → คืน plan นั้น
   * - หมดอายุ → mark expired + downgrade เป็น free อัตโนมัติ
   */
  async getEffectivePlan(workspaceId: bigint): Promise<Plan> {
    const sub = await this.prisma.subscription.findFirst({
      where: { workspaceId, status: { in: ['active', 'trialing', 'canceled'] } },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (sub && sub.currentPeriodEnd > new Date()) return sub.plan;
    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
    }
    return this.freePlan();
  }

  // ── ENFORCEMENT (เรียกจาก wallets/transactions/workspaces) ──
  async assertCanCreateWallet(workspaceId: bigint): Promise<void> {
    const plan = await this.getEffectivePlan(workspaceId);
    if (plan.maxWallets == null) return;
    const used = await this.prisma.wallet.count({
      where: { workspaceId, deletedAt: null },
    });
    if (used >= plan.maxWallets) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_WALLETS',
        message: `แพ็กเกจ ${plan.name} จำกัด ${plan.maxWallets} กระเป๋า — อัปเกรดเพื่อเพิ่ม`,
      });
    }
  }

  private monthBounds(): { gte: Date; lt: Date } {
    const now = new Date();
    return {
      gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    };
  }

  async assertCanCreateTransaction(workspaceId: bigint): Promise<void> {
    const plan = await this.getEffectivePlan(workspaceId);
    if (plan.maxTransactionsMonth == null) return;
    const used = await this.prisma.transaction.count({
      where: { workspaceId, deletedAt: null, createdAt: this.monthBounds() },
    });
    if (used >= plan.maxTransactionsMonth) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_TRANSACTIONS',
        message: `แพ็กเกจ ${plan.name} จำกัด ${plan.maxTransactionsMonth} รายการ/เดือน — อัปเกรดเพื่อเพิ่ม`,
      });
    }
  }

  /** workspace limit = ค่าสูงสุดจาก plan ของ workspace ที่ user เป็นเจ้าของ */
  async assertCanCreateWorkspace(userId: bigint): Promise<void> {
    const owned = await this.prisma.workspace.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { id: true },
    });
    let maxAllowed = 1;
    for (const w of owned) {
      const plan = await this.getEffectivePlan(w.id);
      if (plan.maxWorkspaces == null) return; // unlimited
      maxAllowed = Math.max(maxAllowed, plan.maxWorkspaces);
    }
    if (owned.length >= maxAllowed) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_WORKSPACES',
        message: `แพ็กเกจปัจจุบันจำกัด ${maxAllowed} workspace — อัปเกรดเพื่อเพิ่ม`,
      });
    }
  }

  /** feature flag ตาม plan */
  async hasFeature(
    workspaceId: bigint,
    flag: keyof PlanFeatures,
  ): Promise<boolean> {
    const plan = await this.getEffectivePlan(workspaceId);
    return Boolean((plan.features as PlanFeatures)[flag]);
  }

  // ── สร้าง subscription เริ่มต้น (เรียกตอนสร้าง workspace) ──
  async createTrial(
    tx: Prisma.TransactionClient,
    workspaceId: bigint,
  ): Promise<void> {
    const pro = await tx.plan.findUnique({ where: { code: 'pro' } });
    const now = new Date();
    if (pro) {
      await tx.subscription.create({
        data: {
          workspaceId,
          planId: pro.id,
          status: 'trialing',
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: this.addDays(now, TRIAL_DAYS),
        },
      });
    }
  }

  async createFree(
    tx: Prisma.TransactionClient,
    workspaceId: bigint,
  ): Promise<void> {
    const free = await tx.plan.findUnique({ where: { code: 'free' } });
    const now = new Date();
    if (free) {
      await tx.subscription.create({
        data: {
          workspaceId,
          planId: free.id,
          status: 'active',
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: this.addDays(now, 3650), // free ไม่หมดอายุ
        },
      });
    }
  }

  // ── API methods ──
  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return plans.map((p) => this.mapPlan(p));
  }

  /** subscription ปัจจุบัน + usage (สำหรับ frontend) */
  async current(workspaceId: bigint) {
    const sub = await this.prisma.subscription.findFirst({
      where: { workspaceId, status: { in: ['active', 'trialing', 'canceled'] } },
      orderBy: { createdAt: 'desc' },
    });
    const plan = await this.getEffectivePlan(workspaceId);

    const [walletsUsed, txUsed] = await Promise.all([
      this.prisma.wallet.count({ where: { workspaceId, deletedAt: null } }),
      this.prisma.transaction.count({
        where: { workspaceId, deletedAt: null, createdAt: this.monthBounds() },
      }),
    ]);

    const isTrialing =
      sub?.status === 'trialing' && sub.currentPeriodEnd > new Date();

    return {
      plan: this.mapPlan(plan),
      status: sub && sub.currentPeriodEnd > new Date() ? sub.status : 'active',
      isTrialing,
      trialEndsAt: isTrialing ? sub!.currentPeriodEnd.toISOString() : null,
      currentPeriodEnd: sub?.currentPeriodEnd.toISOString() ?? null,
      usage: {
        wallets: { used: walletsUsed, limit: plan.maxWallets },
        transactions: { used: txUsed, limit: plan.maxTransactionsMonth },
      },
    };
  }

  /** upgrade/downgrade — switch plan (ยังไม่เชื่อม payment จริง; ดู billing note) */
  async changePlan(workspaceId: bigint, dto: ChangePlanDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { code: dto.plan as PlanCode },
    });
    if (!plan || !plan.isActive) throw new NotFoundException('ไม่พบแพ็กเกจ');

    // 💳 BILLING INTEGRATION POINT:
    // แพ็กเกจที่มีราคา > 0 → ปกติต้องสร้าง checkout (Stripe/PromptPay QR)
    // แล้วเปิดใช้งานหลังชำระเงินผ่าน webhook. ตอนนี้ switch ทันที (MVP).
    const now = new Date();
    const periodEnd = this.addDays(now, PERIOD_DAYS);

    const existing = await this.prisma.subscription.findFirst({
      where: { workspaceId, status: { in: ['active', 'trialing', 'canceled'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          status: 'active',
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          workspaceId,
          planId: plan.id,
          status: 'active',
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }
    return this.current(workspaceId);
  }

  async cancel(workspaceId: bigint) {
    const existing = await this.prisma.subscription.findFirst({
      where: { workspaceId, status: { in: ['active', 'trialing', 'canceled'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      // ยังใช้ได้จนหมด period แล้วค่อย downgrade เป็น free อัตโนมัติ
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { status: 'canceled', canceledAt: new Date() },
      });
    }
    return this.current(workspaceId);
  }
}
