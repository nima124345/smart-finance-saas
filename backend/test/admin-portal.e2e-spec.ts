import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

const PREFIX = '/api/v1';

/**
 * Integration tests สำหรับ Step 9 — Dedicated Admin Portal
 * รัน HTTP จริง + Postgres จริง (localhost) ผ่าน NestApplication เต็มรูปแบบ
 *
 * โฟกัสหลัก: security guarantees ของ admin portal
 *  - role enforcement (เฉพาะ systemRole=admin login ได้)
 *  - namespace isolation (tenant token ใช้กับ admin route ไม่ได้)
 *  - tenant data isolation (user เห็นเฉพาะ workspace ตัวเอง)
 */

/** จำลอง bootstrap ใน main.ts ให้ตรง (prefix + pipes + envelope) */
async function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
}

/** ลบ test data ตามลำดับ FK ที่ปลอดภัย */
async function cleanupUsers(prisma: PrismaService, userIds: bigint[]) {
  if (userIds.length === 0) return;
  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const wsIds = workspaces.map((w) => w.id);
  if (wsIds.length > 0) {
    await prisma.transaction.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.payment.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.subscription.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.wallet.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.category.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.membership.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.user.updateMany({
      where: { lastActiveWorkspaceId: { in: wsIds } },
      data: { lastActiveWorkspaceId: null },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: wsIds } } });
  }
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

describe('Admin Portal (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const run = Date.now();
  const adminEmail = `admin.${run}@e2e.test`;
  const adminPass = 'AdminPass123!';
  const tenantAEmail = `tenant-a.${run}@e2e.test`;
  const tenantBEmail = `tenant-b.${run}@e2e.test`;
  const tenantPass = 'TenantPass123!';

  let adminId: bigint;
  let tenantAToken = '';
  let tenantBToken = '';
  let tenantAWorkspaceId = '';
  const createdUserIds: bigint[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // ปิด rate limit ใน functional suite (ทดสอบ rate limit แยกด้านล่าง)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await configureApp(app);
    prisma = app.get(PrismaService);

    // สร้าง admin user ตรงผ่าน DB (ไม่มี API สร้าง admin)
    const adminUser = await prisma.user.create({
      data: {
        name: 'E2E Admin',
        email: adminEmail,
        password: await argon2.hash(adminPass, { type: argon2.argon2id }),
        systemRole: 'admin',
      },
    });
    adminId = adminUser.id;
    createdUserIds.push(adminId);

    // tenant A + tenant B ผ่าน register จริง (ได้ workspace + token)
    const regA = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ name: 'Tenant A', email: tenantAEmail, password: tenantPass });
    tenantAToken = regA.body.data.accessToken;
    createdUserIds.push(
      (await prisma.user.findUniqueOrThrow({ where: { email: tenantAEmail } })).id,
    );

    const regB = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/register`)
      .send({ name: 'Tenant B', email: tenantBEmail, password: tenantPass });
    tenantBToken = regB.body.data.accessToken;
    createdUserIds.push(
      (await prisma.user.findUniqueOrThrow({ where: { email: tenantBEmail } })).id,
    );

    // workspace ส่วนตัวของ A (สร้างอัตโนมัติตอน register)
    const wsA = await request(app.getHttpServer())
      .get(`${PREFIX}/workspaces`)
      .set('Authorization', `Bearer ${tenantAToken}`);
    tenantAWorkspaceId = wsA.body.data[0].publicId;
  });

  afterAll(async () => {
    await cleanupUsers(prisma, createdUserIds);
    await app.close();
  });

  // ── Health ──────────────────────────────────────────────
  it('GET /health → 200 + database connected', async () => {
    const res = await request(app.getHttpServer()).get(`${PREFIX}/health`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
  });

  // ── Admin auth: role enforcement ─────────────────────────
  it('admin login (systemRole=admin) → 200 + accessToken + admin', async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/admin/auth/login`)
      .send({ email: adminEmail, password: adminPass });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.admin.email).toBe(adminEmail);
    // ต้องตั้ง httpOnly cookie ใน admin namespace
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('admin_refresh_token='))).toBe(true);
  });

  it('tenant user login ที่ admin portal → 403 (role enforcement)', async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/admin/auth/login`)
      .send({ email: tenantAEmail, password: tenantPass });
    expect(res.status).toBe(403);
    // ต้องไม่ leak token
    expect(res.body.data?.accessToken).toBeUndefined();
  });

  it('admin login รหัสผ่านผิด → 401 (generic message)', async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/admin/auth/login`)
      .send({ email: adminEmail, password: 'wrong-password-xxx' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── Admin protected routes ───────────────────────────────
  it('GET /admin/dashboard ไม่มี token → 401', async () => {
    const res = await request(app.getHttpServer()).get(`${PREFIX}/admin/dashboard`);
    expect(res.status).toBe(401);
  });

  it('GET /admin/dashboard ด้วย tenant token → 401 (namespace isolation)', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/admin/dashboard`)
      .set('Authorization', `Bearer ${tenantAToken}`);
    expect(res.status).toBe(401);
  });

  it('GET /admin/dashboard ด้วย admin token → 200', async () => {
    const login = await request(app.getHttpServer())
      .post(`${PREFIX}/admin/auth/login`)
      .send({ email: adminEmail, password: adminPass });
    const adminToken = login.body.data.accessToken as string;

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/admin/dashboard`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /admin/auth/me ด้วย admin token → 200 + อีเมล admin', async () => {
    const login = await request(app.getHttpServer())
      .post(`${PREFIX}/admin/auth/login`)
      .send({ email: adminEmail, password: adminPass });
    const adminToken = login.body.data.accessToken as string;

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/admin/auth/me`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(adminEmail);
  });

  // ── Tenant data isolation ────────────────────────────────
  it('tenant B เข้าถึง workspace ของ tenant A ไม่ได้', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/workspaces/${tenantAWorkspaceId}`)
      .set('Authorization', `Bearer ${tenantBToken}`);
    // ต้องไม่ใช่ 200 — ห้ามเห็นข้อมูล workspace ของคนอื่น
    expect([403, 404]).toContain(res.status);
  });

  it('tenant A เข้าถึง workspace ของตัวเองได้ (sanity)', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/workspaces/${tenantAWorkspaceId}`)
      .set('Authorization', `Bearer ${tenantAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.publicId).toBe(tenantAWorkspaceId);
  });
});

describe('Admin login rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // ไม่ override ThrottlerGuard → throttle counter สดของ instance นี้
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await configureApp(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('ยิง admin login รัวๆ → ต้องโดน 429 (brute-force protection)', async () => {
    const server = app.getHttpServer();
    let got429 = false;
    // limit = 5/60s ต่อ IP → ยิงเกินต้องเจอ 429
    for (let i = 0; i < 10; i++) {
      const res = await request(server)
        .post(`${PREFIX}/admin/auth/login`)
        .send({ email: `nobody.${i}@e2e.test`, password: 'whatever-123' });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    expect(got429).toBe(true);
  });
});
