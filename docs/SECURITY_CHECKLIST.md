# Security Checklist (ก่อน Go-Live)

## Authentication & Session
- [x] รหัสผ่าน hash ด้วย **Argon2id**
- [x] Access token (JWT, 15m) ใน memory; refresh token (30d) ใน **httpOnly cookie**
- [x] Refresh token **rotation + reuse detection** (เพิกถอนทั้ง chain เมื่อพบใช้ซ้ำ)
- [x] **Brute-force lockout** — ล็อกชั่วคราวหลังเดารหัสผิดเกินเกณฑ์
- [x] Generic error ตอน login ผิด (ไม่บอกว่า email/password ตัวไหนผิด, มี timing guard)
- [x] Admin auth แยก JWT namespace (`JWT_ADMIN_*`)
- [ ] บังคับ JWT secrets ≥ 32 ตัวอักษร (validate ตอน boot — ตั้งจริงบน prod ด้วย `openssl rand -hex 32`)

## Multi-tenant Isolation
- [x] ทุก query scope ด้วย `workspaceId` (`WorkspaceGuard` แนบ context จาก membership)
- [x] header เป็น **publicId (uuid)** ไม่ใช่ sequential id (กัน enumeration/IDOR)
- [x] RBAC ผ่าน `PermissionGuard` + permission matrix; row-level (Staff แก้เฉพาะของตัวเอง)
- [x] `BusinessGuard` กันเรียก business API จาก personal workspace
- [x] Invitation ใช้ **token hash (SHA-256)** ไม่เก็บ plain; หมดอายุ 7 วัน; ตรวจ email ตรงกับผู้รับ

## Transport & Cookies (production)
- [ ] `COOKIE_SECURE=true` (HTTPS) — validate บังคับใน production
- [ ] `COOKIE_SAMESITE=none` เมื่อ frontend/backend คนละ domain
- [x] CORS allowlist จาก `FRONTEND_URL`/`ADMIN_URL`/`CORS_ORIGIN` (ไม่ใช่ `*`) + `withCredentials`
- [x] Helmet เปิดใช้งาน

## Rate limiting
- [x] Global throttle (`@nestjs/throttler`) — 120 req/60s default
- [ ] ตั้ง `REDIS_URL` เมื่อสเกลหลาย instance (ไม่งั้น counter แยกต่อ pod)

## Data & Secrets
- [ ] Secrets เก็บใน Railway/Vercel env (ไม่ commit `.env`)
- [x] เงินเป็น `BigInt` satang (กัน floating point)
- [x] Soft delete (`deleted_at`) + DB constraints (CHECK amount>0, transfer rules, partial unique)
- [ ] Rotate `GOOGLE_CLIENT_SECRET` ถ้าเคยหลุดในแชต/log

## Input validation
- [x] `class-validator` DTO ทุก endpoint + `ValidationPipe`
- [x] Prisma parameterized queries (กัน SQL injection)

## ก่อน go-live — action items (ช่องที่ยังไม่ติ๊ก)
1. ตั้ง JWT secrets จริง (4 ตัว) ≥ 32 chars บน Railway
2. `COOKIE_SECURE=true` + `COOKIE_SAMESITE=none` บน production
3. พิจารณา `REDIS_URL` ถ้ามีหลาย instance
4. เปิด **Publish app** ใน Google OAuth consent screen (ไม่งั้น login ได้เฉพาะ test users)
5. ตรวจว่า `.env` ไม่อยู่ใน git history
