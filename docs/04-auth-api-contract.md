# Auth API Contract (Step 5)

> Base: `http://localhost:8000/api/v1` · Response envelope: `{ success, data }` / error `{ success:false, error:{code,message} }`
> Refresh token = **httpOnly cookie** (`refresh_token`) — ไม่อยู่ใน body/localStorage
> Access token = ส่งใน body → frontend เก็บใน **memory** (Zustand, ไม่ persist)

## Security summary
| ด้าน | ค่า |
|------|-----|
| Password hash | **Argon2id** |
| Access token | JWT 15 นาที (Bearer header) |
| Refresh token | JWT 30 วัน, **httpOnly cookie**, **rotation ทุกครั้ง** |
| Refresh storage | เก็บ **SHA-256 hash** ใน `refresh_tokens` (ไม่เก็บ plain) |
| Cookie | `httpOnly` · `secure`(prod) · `sameSite=lax` · `path=/api/v1/auth` |
| Login error | generic — `"อีเมลหรือรหัสผ่านไม่ถูกต้อง"` (ไม่บอกว่าอันไหนผิด) |
| Rate limit | login & forgot: 5 ครั้ง / นาที (throttler) |

---

## 1. POST /auth/register
```jsonc
// req
{ "name": "Bench", "email": "a@b.com", "password": "password123" }
// 201 → ตั้ง cookie refresh_token + login อัตโนมัติ
{ "success": true, "data": {
  "accessToken": "<jwt>",
  "user": { "publicId":"...", "name":"Bench", "email":"a@b.com", "systemRole":"user" }
}}
```
ทำใน transaction: สร้าง user (hash) → personal workspace → membership(owner) → free subscription

## 2. POST /auth/login
```jsonc
{ "email": "a@b.com", "password": "password123" }
// 200 → ตั้ง cookie refresh_token
{ "success": true, "data": { "accessToken":"<jwt>", "user": {...} } }
// 401 (generic) → { error: { code:"UnauthorizedException", message:"อีเมลหรือรหัสผ่านไม่ถูกต้อง" } }
```

## 3. POST /auth/refresh
```jsonc
// req: ไม่มี body — ใช้ cookie refresh_token
// 200 → rotate: invalidate token เก่า, ออกใหม่, ตั้ง cookie ใหม่
{ "success": true, "data": { "accessToken":"<jwt>" } }
// 401 → cookie หาย/หมดอายุ/ถูกใช้ซ้ำ (reuse → revoke ทั้งหมดของ user)
```

## 4. POST /auth/logout
```jsonc
// req: cookie refresh_token + Bearer
// 204 → revoke refresh token ใน DB + clear cookie
```

## 5. GET /auth/me   (Bearer)
```jsonc
{ "success": true, "data": { "publicId":"...", "name":"...", "email":"...", "systemRole":"user" } }
```

## 6. POST /auth/forgot-password
```jsonc
{ "email": "a@b.com" }
// 200 เสมอ (ไม่เปิดเผยว่า email มีจริงไหม) — ส่งลิงก์รีเซ็ต (dev: log token)
{ "success": true, "data": { "message":"หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตให้แล้ว" } }
```

## 7. POST /auth/reset-password
```jsonc
{ "email":"a@b.com", "token":"<raw>", "password":"newpassword123" }
// 200 → อัปเดตรหัส + revoke refresh tokens ทั้งหมด + ลบ reset token
{ "success": true, "data": { "message":"รีเซ็ตรหัสผ่านสำเร็จ" } }
```

## 8. GET /workspaces   (Bearer) — ใช้ hydrate หลัง login
```jsonc
{ "success": true, "data": [
  { "publicId":"...", "name":"ส่วนตัว", "type":"personal", "baseCurrency":"THB", "role":"owner" }
]}
```

---

## Frontend session lifecycle
```
login/register → เก็บ accessToken (memory) + set flag cookie sf-auth + hydrate workspaces → /dashboard
app reload     → silent refresh (POST /auth/refresh via cookie) → ได้ accessToken ใหม่ → /me → hydrate
401 ระหว่างใช้ → interceptor refresh → retry
logout         → POST /auth/logout → clear memory + flag cookie → /login
```
