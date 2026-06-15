# Smart Finance SaaS — Backend (NestJS API)

NestJS + Prisma + PostgreSQL · Clean Architecture · JWT + Refresh Token + RBAC · Multi-Tenant (workspace-scoped)

## Prerequisites
- Node.js 20+
- PostgreSQL 14+ (หรือ Supabase)

## Setup
```bash
cd backend
npm install
cp .env.example .env          # แก้ DATABASE_URL + JWT secrets

npx prisma generate           # สร้าง type-safe client
npx prisma migrate dev        # สร้าง + apply migration (Step 5 ขึ้นไป)
npm run db:seed               # seed plans + system categories

npm run start:dev             # http://localhost:8000/api/v1
```

## โครงสร้าง (Clean Architecture)
```
src/
├── main.ts                  # bootstrap: ValidationPipe, helmet, CORS, prefix /api/v1
├── app.module.ts            # wiring + global guards (JWT + Throttler)
├── config/                  # env config + validation
├── prisma/                  # PrismaModule + PrismaService
├── common/                  # guards, decorators, filters, interceptors, dto
│   ├── guards/              # JwtAuthGuard, WorkspaceGuard, RolesGuard, AdminGuard
│   ├── decorators/          # @Public @CurrentUser @CurrentWorkspace @Roles
│   ├── filters/             # AllExceptionsFilter (+ Prisma error map)
│   └── interceptors/        # TransformInterceptor (response envelope)
└── modules/                 # โดเมน: controller → service → repository
    ├── auth/                # register, login, refresh, forgot/reset, me
    ├── users/  workspaces/  memberships/
    ├── wallets/  categories/  transactions/
    └── dashboard/  subscriptions/  admin/
```

ทุกชั้น: **Controller (thin) → Service (use case) → Repository (Prisma)** ; DTO + class-validator คุม input

## Request flow & Multi-Tenancy
1. `JwtAuthGuard` (global) — ตรวจ access token, แนบ `request.user` (ยกเว้น `@Public`)
2. `WorkspaceGuard` — อ่าน `X-Workspace-Id` (publicId) → ตรวจ membership → แนบ `request.workspace = { workspaceId, role }`
3. `RolesGuard` — ตรวจ `@Roles(...)` ตาม membership role
4. Service query ทุกครั้ง scope ด้วย `workspaceId` (กันข้อมูลข้าม tenant)

## สถานะ skeleton
Service methods เป็น stub (`throw 'Not implemented — Step N'`) — จะเติม business logic ตาม roadmap:
Step 5 (Auth) · Step 6 (Transaction CRUD) · Step 7 (Dashboard) · Step 8 (Subscription + Admin)
