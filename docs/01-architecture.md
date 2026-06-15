# Smart Finance SaaS — Architecture (Step 1)

> สถานะ: ✅ อนุมัติแล้ว (2026-06-15)
> เอกสารนี้เป็นสัญญาทางสถาปัตยกรรม (architectural contract) ที่ทุก Step ถัดไปต้องยึดตาม

---

## 1. Vision

Multi-Tenant Finance SaaS รองรับ 2 โหมดการใช้งานผ่านแนวคิด **Workspace**:

- **Personal Mode** — รายรับ, รายจ่าย, เงินเดือน, ค่าใช้จ่ายประจำวัน, เงินออม
- **Business Mode** — รายรับร้าน, รายจ่ายร้าน, ต้นทุน, กำไรเบื้องต้น, รายงานสรุป

---

## 2. Tech Stack (ล็อกแล้ว)

| ชั้น | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS + **Shadcn UI** + Zustand |
| Backend | **NestJS** (TypeScript, modular, RESTful) |
| ORM | **Prisma** (type-safe, migrations) |
| Auth | **JWT (access) + Refresh Token + RBAC** — Passport (`@nestjs/jwt`, `passport-jwt`) |
| Database | PostgreSQL (**Supabase**) |
| Validation | `class-validator` + `class-transformer` (DTO) |
| Charts | Recharts (frontend) |
| HTTP Client | Axios (interceptor: attach JWT, refresh on 401) |
| Hosting | Frontend → **Vercel** · Backend → **Railway/Render** · DB → **Supabase** |

---

## 3. Architectural Decisions (ADR สรุป)

| # | หัวข้อ | การตัดสินใจ | เหตุผล |
|---|--------|-------------|--------|
| ADR-01 | Multi-Tenancy | **Shared DB + `workspace_id`** (Row-Level Isolation) | ต้นทุนต่ำ, scale ง่าย, มาตรฐาน SaaS สมัยใหม่ |
| ADR-02 | Workspace Sharing | **เผื่อโครงสร้าง Membership + Role** แต่ V1 UI ใช้คนเดียว | ไม่ต้องรื้อ schema เมื่อเพิ่มฟีเจอร์แชร์ |
| ADR-03 | Money Storage | **เก็บเป็น integer (สตางค์)**, สกุลเงิน THB | เลี่ยง floating-point error, แม่นยำ |
| ADR-04 | Auth | JWT access (สั้น) + Refresh Token + RBAC ผ่าน Passport | มาตรฐาน, refresh ปลอดภัย, รองรับ role |
| ADR-05 | Backend Pattern | NestJS Modular + Clean Architecture (Controller → Service → Repository) | แยก concern, ทดสอบง่าย, scale |
| ADR-06 | ORM | **Prisma** + native enum | type-safe, DX ดี, migration ดี |
| ADR-07 | Enum | Prisma native enum (= Postgres enum) | type-safe ทั้ง DB + TS |
| ADR-08 | Tenant Isolation | App-level (WorkspaceGuard + Prisma filter); เผื่อ Supabase RLS ชั้น 2 | คุมจาก code, RLS เป็น defense-in-depth |

---

## 4. Tenant Model

```
User (1 อีเมล = 1 บัญชีล็อกอิน)
  └── Membership (user_id, workspace_id, role) ── many-to-many
        └── Workspace (Tenant Boundary)
              ├── type: personal | business
              ├── currency: THB (default)
              └── owns → Categories, Transactions, (future) Reports
```

- **Workspace = ขอบเขตแยกข้อมูลจริง** ทุกตารางธุรกิจมี `workspace_id`
- **WorkspaceGuard** ตรวจ membership ทุก request + แนบ `workspaceId` ลง request context
- **Prisma filter / extension** บังคับ `workspace_id` ทุก query (กันข้อมูลข้าม tenant)
- **(เผื่อ) Supabase RLS** เป็นชั้นป้องกันที่ 2 ระดับ DB

---

## 5. Backend Layout (NestJS + Clean Architecture)

```
backend/
├── prisma/schema.prisma        # Single source of truth (DB schema)
└── src/
    ├── main.ts                 # bootstrap (ValidationPipe, CORS, prefix /api/v1)
    ├── app.module.ts
    ├── config/                 # env validation, config module
    ├── prisma/                 # PrismaModule + PrismaService
    ├── common/                 # shared: guards, decorators, filters, interceptors, dto, enums
    │   ├── guards/             # JwtAuthGuard, RolesGuard, WorkspaceGuard
    │   ├── decorators/         # @CurrentUser, @CurrentWorkspace, @Roles, @Public
    │   ├── filters/            # AllExceptionsFilter, PrismaExceptionFilter
    │   └── interceptors/       # TransformResponse
    └── modules/                # feature modules (domain)
        └── <feature>/          # controller → service → repository, dto/, entities/
            ├── auth/  users/  workspaces/  memberships/
            └── wallets/  categories/  transactions/  dashboard/  subscriptions/  admin/

หลักการ: Controller (thin) → Service (use case) → Repository (Prisma) ; DTO + class-validator คุม I/O
```

---

## 6. Frontend Layout (Feature-Based)

```
src/
├── app/
│   ├── (auth)/                # login, register, forgot-password
│   ├── (dashboard)/           # protected layout + sidebar
│   └── (admin)/               # admin-only
├── features/                  # auth, transactions, dashboard, workspace
│   └── <feature>/             # components, hooks, api, types
├── components/ui/             # Shadcn UI primitives (Button, Card, Input, Dialog...)
├── lib/                       # apiClient, utils, formatters (money/date)
├── store/                     # Zustand: authStore, workspaceStore
└── types/                     # shared types
```

---

## 7. Security Checklist (Secure Coding)

- [ ] Prisma parameterized queries เท่านั้น — เลี่ยง `$queryRawUnsafe` (กัน SQL Injection)
- [ ] DTO + `class-validator` + `whitelist: true` ทุก endpoint (กัน over-posting/Mass Assignment)
- [ ] WorkspaceGuard + Prisma filter ตรวจ `workspace_id` ทุก request (กันข้อมูลข้าม tenant)
- [ ] JWT access สั้น + refresh token (rotate), password hash (argon2/bcrypt)
- [ ] RBAC: RolesGuard + `@Roles()` (membership role + system role)
- [ ] Rate limiting (`@nestjs/throttler`) ที่ login / forgot-password (กัน brute force)
- [ ] Security headers (`helmet`) + CORS allowlist
- [ ] Secrets ใน `.env` (ไม่ commit) + env validation ตอน boot

---

## 8. Roadmap

| Step | Deliverable |
|------|-------------|
| 1 ✅ | Architecture (เอกสารนี้) |
| 2 | Database Schema + ER Diagram |
| 3 | NestJS API skeleton (Clean Arch) + Prisma schema |
| 4 | Next.js skeleton + Shadcn UI design system |
| 5 | Authentication (register/login/forgot/JWT) |
| 6 | Transaction CRUD + Filter |
| 7 | Dashboard + Charts |
| 8 | Subscription + Admin SaaS |
