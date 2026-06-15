# Smart Finance SaaS — Frontend Architecture (Step 4)

> สถานะ: 🟡 รออนุมัติ
> Next.js 15 (App Router) · TypeScript · Tailwind v3 · Shadcn UI (new-york) · Zustand v5 · TanStack Query v5 · Axios

---

## 1. Folder Structure (Feature-Based)

```
frontend/src/
├── app/                      # App Router (route + layout)
│   ├── (auth)/               # login · register · forgot-password
│   ├── (dashboard)/          # protected shell (sidebar+topbar)
│   ├── (admin)/              # protected + role=admin
│   ├── layout.tsx · globals.css · page.tsx
├── middleware.ts             # edge route protection (cookie)
├── components/
│   ├── ui/                   # Shadcn primitives
│   ├── common/               # empty/error/loading state, page-header, auth-guard
│   └── layout/               # sidebar, topbar, workspace-switcher
├── features/<domain>/        # api/ hooks/ components/ types
├── lib/{api,query,format,utils,constants}
├── stores/{auth,workspace,theme,ui}
├── providers/{app,query,theme}
├── config/nav.ts
└── types/{api,domain}
```

**หลักการ:** จัดตาม **feature/domain** ไม่ใช่ตาม type — โค้ดที่เปลี่ยนด้วยกันอยู่ด้วยกัน

---

## 2. Route Architecture

ใช้ **Route Groups** `( )` แยก layout โดยไม่กระทบ URL:

| URL | Group | Protection |
|-----|-------|-----------|
| `/login` `/register` `/forgot-password` | `(auth)` | public (มี token → เด้ง `/dashboard`) |
| `/dashboard` | `(dashboard)` | ต้องล็อกอิน |
| `/wallets` `/transactions` `/categories` | `(dashboard)` | ต้องล็อกอิน + workspace |
| `/subscriptions` `/settings` | `(dashboard)` | ต้องล็อกอิน |
| `/admin` | `(admin)` | ล็อกอิน + `systemRole=admin` |

2 ชั้นการป้องกัน: **`middleware.ts`** (edge, coarse, อิง cookie) + **`<AuthGuard>`** (client, fine-grained role)

---

## 3. Design System

| โทเคน | ค่า |
|-------|-----|
| **Base palette** | zinc neutrals (พื้นหลังเกือบขาว/เกือบดำ, border บาง) |
| **Primary** | Indigo `hsl(243 75% 59%)` |
| **Finance semantics** | income=emerald · expense=rose · transfer=sky |
| **Radius** | `0.625rem` (การ์ด `rounded-xl`) |
| **Font** | Inter (sans) · JetBrains Mono (ตัวเลขเงิน) |
| **Spacing** | สเกล Tailwind (page `p-4 lg:p-6`, การ์ด `p-6`, content `max-w-6xl`) |
| **Dark mode** | class strategy (`.dark`) ผ่าน Zustand theme + system detect |

ทุกโทเคนเป็น **CSS variables** ใน `globals.css` → ปรับธีมทั้งระบบได้ที่เดียว

**Component states (พร้อมใช้):**
| State | Component |
|-------|-----------|
| Button | `ui/button` (default/outline/ghost/destructive/link · sm/lg/icon) |
| Card | `ui/card` (Header/Title/Description/Content/Footer) |
| Form | `ui/input` + `ui/label` |
| Loading | `common/loading-state` (`LoadingState`, `StatCardsSkeleton`) |
| Empty | `common/empty-state` |
| Error | `common/error-state` (+ retry) |
| Page header | `common/page-header` |

> Modal/Table primitives (dialog, dropdown-menu, table) เพิ่มผ่าน `npx shadcn add` ตอนต้องใช้จริง (Step 6)

---

## 4. State Management Strategy

| ชนิด state | เครื่องมือ | ตัวอย่าง |
|-----------|-----------|---------|
| **Server data** | TanStack Query | transactions, wallets, dashboard |
| **Auth (client)** | Zustand `auth-store` (persist) | user, accessToken, refreshToken |
| **Active workspace** | Zustand `workspace-store` (persist activeId) | สลับ workspace |
| **Theme** | Zustand `theme-store` (persist) | light/dark/system |
| **UI ephemeral** | Zustand `ui-store` | sidebar, command palette |

**กฎ:** server data ไม่เก็บใน Zustand (ให้ Query cache จัดการ) · เปลี่ยน workspace → invalidate query key `["ws", id, ...]`

---

## 5. API Layer Strategy

`lib/api/axios.ts` — instance กลาง 1 ตัว:
- **Request interceptor:** แนบ `Authorization: Bearer <accessToken>` + `X-Workspace-Id` (จาก store) อัตโนมัติ
- **Response interceptor (401):** refresh token อัตโนมัติ + **queue** request ที่ค้างระหว่าง refresh → retry; ถ้า refresh fail → clear + เด้ง `/login`
- **Error envelope:** `getApiErrorMessage()` ดึงข้อความจาก `{ error: { message } }` ของ backend
- **endpoints.ts:** รวม path ทั้งหมด (typed)

Feature เรียกผ่าน `features/<x>/api/*.api.ts` → unwrap `{ success, data }` → คืน data ดิบ

---

## 6. Authentication Flow

```
┌─────────── REGISTER / LOGIN ───────────┐
│ Form → useLogin() (TanStack mutation)   │
│   → authApi.login() [POST /auth/login]  │
│   → { accessToken, refreshToken }       │
│   → authStore.setAuth() + set cookie    │
│   → fetch /auth/me → setUser            │
│   → fetch /workspaces → workspaceStore  │
│   → router.replace('/dashboard')        │
└─────────────────────────────────────────┘

┌─────────── AUTHENTICATED REQUEST ───────┐
│ api.get(...)                            │
│   ├ req interceptor: + Bearer token     │
│   └ + X-Workspace-Id (active workspace) │
└─────────────────────────────────────────┘

┌─────────── TOKEN EXPIRED (401) ─────────┐
│ res interceptor catches 401             │
│   ├ isRefreshing? → เข้า queue, รอ       │
│   └ else: POST /auth/refresh            │
│        ├ success → setTokens → flush     │
│        │           queue → retry req     │
│        └ fail → clear() → /login         │
└─────────────────────────────────────────┘

┌─────────── PROTECTED ROUTE ─────────────┐
│ 1) middleware.ts (edge): cookie `sf-auth`│
│      ✗ → /login   ✓ → ผ่าน               │
│ 2) <AuthGuard requireRole?>: client      │
│      ✗ auth → /login                     │
│      ✗ role=admin → /dashboard           │
└─────────────────────────────────────────┘
```

> หมายเหตุ: token เก็บใน localStorage (Zustand persist) — Step 5 จะ sync flag ลง **cookie** เพื่อให้ middleware (edge) อ่านได้

---

## 7. Roadmap mapping
| Step | Frontend deliverable |
|------|----------------------|
| 4 ✅ | Skeleton architecture (เอกสารนี้) |
| 5 | Auth forms + token/cookie sync + workspace hydrate |
| 6 | Transactions/Wallets/Categories (table, form, dialog, filter) |
| 7 | Dashboard stat cards + Recharts |
| 8 | Subscription plan cards + Admin panel |
