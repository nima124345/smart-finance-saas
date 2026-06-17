import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed (idempotent ด้วย upsert/findFirst)
 *  - plans: Free / Pro / Business / Premium (4 ระดับ)
 *  - system categories (personal): workspaceId = null
 *  (business categories ถูก seed ต่อ-workspace ตอนสร้าง workspace แบบ business — ดู workspaces.service)
 */
async function seedPlans(): Promise<void> {
  const plans = [
    {
      code: 'free' as const,
      name: 'Free',
      price: BigInt(0),
      maxWorkspaces: 1,
      maxWallets: 2,
      maxTransactionsMonth: 100,
      maxMembers: 1,
      features: {
        advancedDashboard: false,
        exportCsv: false,
        teamMembers: false,
        businessDashboard: false,
        businessReports: false,
        activityLog: false,
        aiInsights: false,
      },
    },
    {
      code: 'pro' as const,
      name: 'Pro',
      price: BigInt(9900), // ฿99/เดือน — power features ส่วนบุคคล
      maxWorkspaces: 5,
      maxWallets: null, // unlimited
      maxTransactionsMonth: null,
      maxMembers: 1,
      features: {
        advancedDashboard: true,
        exportCsv: true,
        teamMembers: false,
        businessDashboard: false,
        businessReports: false,
        activityLog: false,
        aiInsights: false,
      },
    },
    {
      code: 'business' as const,
      name: 'Business',
      price: BigInt(29900), // ฿299/เดือน — ทีม + รายงานธุรกิจ
      maxWorkspaces: null,
      maxWallets: null,
      maxTransactionsMonth: null,
      maxMembers: 10,
      features: {
        advancedDashboard: true,
        exportCsv: true,
        teamMembers: true,
        businessDashboard: true,
        businessReports: true,
        activityLog: true,
        aiInsights: false,
      },
    },
    {
      code: 'premium' as const,
      name: 'Premium',
      price: BigInt(59900), // ฿599/เดือน — Business + AI Insights
      maxWorkspaces: null,
      maxWallets: null,
      maxTransactionsMonth: null,
      maxMembers: null, // unlimited
      features: {
        advancedDashboard: true,
        exportCsv: true,
        teamMembers: true,
        businessDashboard: true,
        businessReports: true,
        activityLog: true,
        aiInsights: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        price: plan.price,
        maxWorkspaces: plan.maxWorkspaces,
        maxWallets: plan.maxWallets,
        maxTransactionsMonth: plan.maxTransactionsMonth,
        maxMembers: plan.maxMembers,
        features: plan.features,
      },
      create: plan,
    });
  }
}

async function seedSystemCategories(): Promise<void> {
  const income = ['เงินเดือน', 'รายได้เสริม', 'โบนัส', 'ดอกเบี้ย/เงินปันผล', 'ของขวัญ'];
  const expense = [
    'อาหาร',
    'เดินทาง',
    'ที่พัก',
    'ค่าน้ำค่าไฟ',
    'ช้อปปิ้ง',
    'สุขภาพ',
    'บันเทิง',
    'การศึกษา',
    'อื่นๆ',
  ];

  const items = [
    ...income.map((name, i) => ({ name, type: 'income' as const, sortOrder: i })),
    ...expense.map((name, i) => ({ name, type: 'expense' as const, sortOrder: i })),
  ];

  for (const item of items) {
    // ไม่มี unique constraint → ใช้ findFirst (idempotent)
    const existing = await prisma.category.findFirst({
      where: { workspaceId: null, name: item.name, type: item.type, isSystem: true },
      select: { id: true },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          workspaceId: null,
          name: item.name,
          type: item.type,
          isSystem: true,
          sortOrder: item.sortOrder,
        },
      });
    }
  }
}

async function main(): Promise<void> {
  await seedPlans();
  await seedSystemCategories();
  // eslint-disable-next-line no-console
  console.log('✅ Seed completed (plans x4 + system categories)');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
