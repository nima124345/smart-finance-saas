<div align="center">
  <img src="frontend/public/logo.png" alt="Smart Finance" width="160" />

  # Smart Finance SaaS

  ระบบจัดการรายรับ–รายจ่าย แบบ Multi-Tenant SaaS สำหรับบุคคลทั่วไปและร้านค้า/ธุรกิจขนาดเล็ก
</div>

---

## ✨ Features

- 🔐 **Authentication** — JWT access + refresh token rotation, Argon2, ลืมรหัสผ่าน
- 🏢 **Multi-Tenant** — แยกข้อมูลด้วย Workspace (personal / business)
- 💸 **Transaction Engine** — รายรับ / รายจ่าย / โอนระหว่างกระเป๋า + filter + cursor pagination
- 👛 **Wallets** — หลายกระเป๋า (เงินสด / ธนาคาร / พร้อมเพย์) + คำนวณยอดอัตโนมัติ
- 📊 **Dashboard** — กราฟ (Recharts), insights, สรุปตามช่วงเวลา
- 💎 **Subscription** — Free / Pro / Premium + plan limit enforcement + PRO trial 14 วัน
- 🛠️ **Admin Dashboard** — จัดการผู้ใช้ + MRR / ARR / growth stats

## 🧱 Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind · Shadcn UI · Zustand · TanStack Query |
| Backend | NestJS · Prisma · JWT (Passport) |
| Database | PostgreSQL |
| Charts | Recharts |

## 📁 Structure

```
.
├── backend/     # NestJS API (Clean Architecture)
├── frontend/    # Next.js app (Feature-based)
└── docs/        # Architecture & API contracts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (หรือ Docker)

### Backend
```bash
cd backend
npm install
cp .env.example .env          # ตั้ง DATABASE_URL + JWT secrets
npx prisma generate
npx prisma migrate deploy     # หรือ prisma db push สำหรับ dev
npm run db:seed               # plans + system categories
npm run start:dev             # http://localhost:8000/api/v1
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # ตั้ง NEXT_PUBLIC_API_URL
npm run dev                        # http://localhost:3000
```

## 📄 License

MIT
