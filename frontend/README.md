# Smart Finance SaaS — Frontend (Next.js)

Next.js 15 (App Router) · TypeScript · Tailwind v3 · Shadcn UI · Zustand · TanStack Query · Axios

## Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local   # ตั้ง NEXT_PUBLIC_API_URL ให้ชี้ backend
npm run dev                        # http://localhost:3000
```
> ต้องรัน backend (NestJS) ที่ http://localhost:8000/api/v1 คู่กัน

## โครงสร้าง
```
src/
├── app/                    # App Router
│   ├── (auth)/             # login, register, forgot-password
│   ├── (dashboard)/        # protected: dashboard, wallets, transactions, categories, subscriptions, settings
│   ├── (admin)/            # protected + role=admin
│   ├── layout.tsx          # root: fonts + AppProviders
│   └── globals.css         # design tokens (CSS variables)
├── middleware.ts           # route protection ชั้นแรก (cookie)
├── components/
│   ├── ui/                 # Shadcn primitives (button, card, input, label, skeleton)
│   ├── common/             # empty/error/loading state, page-header, auth-guard
│   └── layout/             # sidebar, topbar, workspace-switcher
├── features/               # โดเมน: auth, transactions, wallets, ... (api + hooks + components)
├── lib/
│   ├── api/                # axios client + interceptors + endpoints
│   ├── query/              # query client + keys
│   ├── format.ts           # money(สตางค์)/date formatters
│   └── utils.ts            # cn()
├── stores/                 # Zustand: auth, workspace, theme, ui
├── providers/              # AppProviders, Query, Theme
├── config/                 # nav config
└── types/                  # api + domain types
```

## สถานะ skeleton
หน้าเพจเป็น placeholder (PageHeader + EmptyState). Form/Table/Chart จริงเติมตาม roadmap:
Step 5 (Auth) · Step 6 (Transactions/Wallets/Categories) · Step 7 (Dashboard) · Step 8 (Subscription/Admin)
