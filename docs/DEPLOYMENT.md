# Production Deployment Runbook

สถาปัตยกรรม production ของ Smart Finance SaaS:

```
┌──────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│  Vercel      │─────▶│  Railway (NestJS)   │─────▶│ Supabase (PG)    │
│  Next.js Web │ CORS │  REST API /api/v1   │      │ PostgreSQL       │
└──────────────┘      └─────────────────────┘      └──────────────────┘
```

- **Web (Vercel):** `https://frontend-one-ruby-74.vercel.app`
- **API (Railway):** `https://smart-finance-saas-production-68ce.up.railway.app`
- **DB (Supabase):** PostgreSQL (pooled + direct connection)

---

## 1) Supabase (Database)

1. สร้าง project → **Project Settings → Database** เอา connection string
2. ตั้ง 2 ตัวบน Railway:
   - `DATABASE_URL` = **Connection pooling** (PgBouncer, port `6543`) + `?pgbouncer=true`
   - `DIRECT_URL` = **Direct connection** (port `5432`) — ใช้ตอน migrate
3. เปิด `pgcrypto` extension (มาพร้อม Supabase) — ใช้ `gen_random_uuid()`

## 2) Railway (Backend API)

1. New Project → Deploy from GitHub repo (`backend/` เป็น root, Dockerfile detect อัตโนมัติ)
2. ตั้ง **Environment Variables** (ดู [ENVIRONMENT.md](ENVIRONMENT.md)) — อย่างน้อย:
   ```
   DATABASE_URL, DIRECT_URL,
   JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
   JWT_ADMIN_ACCESS_SECRET, JWT_ADMIN_REFRESH_SECRET,
   FRONTEND_URL=https://<vercel-app>,
   COOKIE_SECURE=true, COOKIE_SAMESITE=none,
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
   GOOGLE_CALLBACK_URL=https://<api>/api/v1/auth/google/callback
   ```
3. **startCommand = `node dist/main`** เท่านั้น (อย่าใส่ `prisma migrate deploy` ใน boot path — ทำให้ healthcheck flaky). รัน migration แยก (ดูข้อ 4)
4. Healthcheck: `GET /api/v1/health` ต้องตอบ 200

> ⚠️ **กับดักที่เคยเจอ:** domain `smart-finance-backend-production.up.railway.app` ตอบ 502 (`x-railway-fallback: true`) — ใช้ URL จริง `smart-finance-saas-production-68ce.up.railway.app` เท่านั้น
> ⚠️ อย่าใช้ `railway down` ตอน prod กำลัง serve (ลบ deployment ที่ active) — rollback ผ่าน dashboard แทน

## 3) Migration + Seed (รันครั้งแรก & ทุกครั้งที่ schema เปลี่ยน)

```bash
cd backend
railway run npx prisma migrate deploy   # apply pending migrations
railway run npx prisma db seed          # upsert plans (Free/Pro/Business/Premium) + system categories
```
รายละเอียด: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

## 4) Vercel (Frontend)

```bash
vercel --cwd frontend deploy --prod --yes \
  --build-env NEXT_PUBLIC_API_URL="https://<api>/api/v1" \
  --build-env NEXT_PUBLIC_APP_NAME="Smart Finance"
```
- หลัง deploy ได้ URL ใหม่ → อัปเดต `FRONTEND_URL` บน Railway ให้ตรง (ไม่งั้น CORS บล็อก)
- เปลี่ยน `NEXT_PUBLIC_*` = ต้อง rebuild (inline ตอน build)

## 5) Google OAuth setup
1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. OAuth consent screen (External) → OAuth client ID (Web application)
3. **Authorized redirect URI** = `https://<api>/api/v1/auth/google/callback`
4. ใส่ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` บน Railway

## 6) Post-deploy smoke test
```bash
curl https://<api>/api/v1/health                 # → 200, database connected
# เปิดเว็บ → สมัคร/login → สร้าง business workspace → ลองทุกเมนู (ดู checklist ด้านล่าง)
```

### Route checklist (หลัง deploy)
| Route | คาดหวัง |
|-------|---------|
| `/login`, `/register` | login/สมัคร + ปุ่ม Google |
| `/onboarding` | wizard personal/business |
| `/dashboard`, `/wallets`, `/transactions`, `/categories` | ใช้งานได้ทุก workspace |
| `/business`, `/reports`, `/insights`, `/activity` | เฉพาะ business + role/plan ที่ถูกต้อง (ไม่ผ่าน = upgrade/permission card) |
| `/team` | business — เชิญ/เปลี่ยน role/ลบ |
| `/subscriptions` | 4 แพ็กเกจ |
| `/invite?token=...` | preview + เข้าร่วมทีม |

## Build timing (จากประสบการณ์จริง)
- Railway Docker rebuild: ~7–13 นาที + edge propagate ~6 นาที หลัง churn หลายรอบ
- อย่า push/redeploy ถี่ๆ → build queue ตัน
