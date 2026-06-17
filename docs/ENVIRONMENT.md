# Environment Variables

อ้างอิงตัวแปรแวดล้อมทั้งหมดของ Smart Finance SaaS

> ตัวอย่างเต็มอยู่ที่ `backend/.env.example` และ `frontend/.env.local.example`

## Backend (NestJS)

### App
| Variable | Required | Default | คำอธิบาย |
|----------|:--------:|---------|----------|
| `NODE_ENV` | – | `development` | `production` บน prod |
| `PORT` | – | `8000` | Railway กำหนดให้อัตโนมัติ (มักเป็น 8080) |
| `API_PREFIX` | – | `api/v1` | prefix ของทุก route |
| `FRONTEND_URL` | ✅ | `http://localhost:3000` | origin ของ tenant app (ใช้ทำ CORS + ลิงก์อีเมล) |
| `ADMIN_URL` | – | – | origin ของ admin portal (ถ้าแยก domain) |
| `CORS_ORIGIN` | – | – | override allowlist (คั่นด้วย comma); ว่าง = `FRONTEND_URL`+`ADMIN_URL` |

### Database (PostgreSQL / Supabase)
| Variable | Required | คำอธิบาย |
|----------|:--------:|----------|
| `DATABASE_URL` | ✅ | pooled connection (PgBouncer, port 6543 บน Supabase) — runtime |
| `DIRECT_URL` | ✅ | direct connection (port 5432) — `prisma migrate` |

### JWT / Cookie
| Variable | Required | Default | คำอธิบาย |
|----------|:--------:|---------|----------|
| `JWT_ACCESS_SECRET` | ✅ | – | ≥ 32 ตัวอักษร (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | ✅ | – | ≥ 32 ตัวอักษร |
| `JWT_ACCESS_TTL` | – | `15m` | |
| `JWT_REFRESH_TTL` | – | `30d` | |
| `JWT_ADMIN_ACCESS_SECRET` | ✅ | – | namespace แยกของ admin (≥ 32) |
| `JWT_ADMIN_REFRESH_SECRET` | ✅ | – | (≥ 32) |
| `COOKIE_SECURE` | – | `false` | **`true` ใน production (HTTPS)** |
| `COOKIE_SAMESITE` | – | `lax` | `none` เมื่อ frontend/backend คนละ domain (ต้อง `COOKIE_SECURE=true`) |
| `COOKIE_DOMAIN` | – | – | parent domain สำหรับแชร์ cookie ข้าม subdomain |

### Google OAuth
| Variable | Required | คำอธิบาย |
|----------|:--------:|----------|
| `GOOGLE_CLIENT_ID` | – | จาก Google Cloud Console (Web application) |
| `GOOGLE_CLIENT_SECRET` | – | คู่กับ client id |
| `GOOGLE_CALLBACK_URL` | – | ต้องตรงกับ Authorized redirect URI เป๊ะ เช่น `https://<api>/api/v1/auth/google/callback` |

> ไม่ตั้ง 3 ตัวนี้ → ปุ่ม Login with Google จะได้ `401 invalid_client`

### Business / Rate-limit / Mail
| Variable | Required | Default | คำอธิบาย |
|----------|:--------:|---------|----------|
| `PDF_FONT_PATH` | – | – | path ไป TTF ฟอนต์ไทย (เช่น NotoSansThai) สำหรับ PDF export ภาษาไทย |
| `THROTTLE_TTL` | – | `60` | window (วินาที) |
| `THROTTLE_LIMIT` | – | `120` | จำนวน request ต่อ window |
| `REDIS_URL` | – | – | ตั้งเมื่อสเกลหลาย instance → rate limit แชร์ข้าม pod |
| `MAIL_FROM` | – | – | ผู้ส่งอีเมล (forgot password / invitation — ยังไม่ wire mail provider) |

## Frontend (Next.js)
| Variable | Required | คำอธิบาย |
|----------|:--------:|----------|
| `NEXT_PUBLIC_API_URL` | ✅ | base URL ของ API รวม `/api/v1` เช่น `https://<api>/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | – | ชื่อแอป (default `Smart Finance`) |

> ⚠️ ตัวแปร `NEXT_PUBLIC_*` ถูก inline ตอน **build** บน Vercel — เปลี่ยนแล้วต้อง redeploy
