# Release Notes

## v1.0.0 — Business Workspace (2026-06-17)

Smart Finance SaaS ก้าวจาก "แอปจดรายรับรายจ่าย" สู่ **SaaS เชิงธุรกิจเต็มรูปแบบ** — รองรับทั้งลูกค้าส่วนตัวและร้านค้า/ธุรกิจ พร้อมโมเดลรายได้แบบ subscription 4 ระดับ

### 🏪 ใหม่: Business Workspace
- **Team Management** — เชิญสมาชิกทางอีเมล (token + หมดอายุ 7 วัน), บทบาท **Owner / Manager / Staff**, permission matrix, เปลี่ยน role / ลบสมาชิก
- **Business Dashboard** — รายได้วันนี้/เดือนนี้, ค่าใช้จ่าย, กำไรสุทธิ, อัตรากำไร, แนวโน้มรายได้-รายจ่าย, หมวดหมู่สูงสุด, กิจกรรมทีมล่าสุด
- **Business Reports** — รายงานรายได้ / ค่าใช้จ่าย / กำไร-ขาดทุน + เลือกช่วง (เดือนนี้ / เดือนก่อน / กำหนดเอง) + **Export PDF & Excel**
- **Activity Log** — timeline ใคร สร้าง/แก้/ลบ รายการ + filter + pagination
- **AI Insights** (Premium) — วิเคราะห์แนวโน้ม + คำแนะนำอัตโนมัติ (rule-based engine, ออกแบบ provider ให้ต่อ Claude ได้ภายหลัง)

### 💎 Pricing ใหม่ (4 ระดับ)
| Plan | ราคา/เดือน | จุดเด่น |
|------|-----------:|---------|
| Free | ฿0 | เริ่มต้นใช้งานส่วนตัว |
| Pro | ฿99 | Dashboard ขั้นสูง + Export CSV + 5 workspace |
| **Business** | **฿299** | + ทีม (10 คน) + Business Dashboard + รายงาน + Activity Log |
| **Premium** | **฿599** | + AI Insights + สมาชิกไม่จำกัด |

### 🔐 Auth
- เพิ่ม **Google OAuth** (login/signup)

### 🧱 Architecture
- เก็บ DB role enum เดิม (`owner/admin/member`) + เพิ่มชั้น **permission matrix** (`PermissionGuard` + `@RequirePermission`) — ไม่ rename enum (เลี่ยง migration เสี่ยง)
- Gating หลายชั้น: `WorkspaceGuard` → `BusinessGuard` → `PermissionGuard` → plan `assertFeature`
- Frontend: **FeatureGate** component กลาง (business-only / role / plan) + upgrade CTA
- เมนู sidebar ปรับอัตโนมัติตามประเภท workspace + role

### 🗄️ Database
- migration `20260617130000_business_workspace`: PlanCode `business`, `Plan.maxMembers`, `WorkspaceInvitation`, `ActivityLog`, enum `InvitationStatus`
- business workspace สร้างหมวดหมู่เริ่มต้นอัตโนมัติ (ยอดขาย/วัตถุดิบ/ค่าเช่า/ค่าน้ำค่าไฟ/เงินเดือน/การตลาด/อุปกรณ์/ขนส่ง/ภาษี)

### ✅ Quality
- Backend: `nest build` ผ่าน + **32 unit/integration tests** (period math, permission matrix, guards, reports aggregation, team role-rules, insight engine)
- Frontend: `next build` ผ่าน (30 routes) + ESLint clean + tsc ไม่มี error

### ⚠️ Known limitations
- PDF export ภาษาไทยต้องตั้ง `PDF_FONT_PATH` (TTF ไทย) — ไม่งั้น fallback Helvetica (Excel รองรับ Unicode เต็ม)
- AI Insights เป็น rule-based (ยังไม่ต่อ Claude API จริง — interface พร้อมแล้ว)
- Mail provider สำหรับคำเชิญ/reset ยังไม่ wire (dev: log ลิงก์; prod: TODO)
- Billing เป็น switch plan ทันที (ยังไม่ต่อ payment gateway จริง)

### 📋 Upgrade steps (สำหรับ deploy)
```bash
cd backend
railway run npx prisma migrate deploy
railway run npx prisma db seed
# Vercel: redeploy frontend (มี business routes ใหม่)
```
