# API Reference — Business Workspace

Base URL: `{NEXT_PUBLIC_API_URL}` = `https://<api>/api/v1`

## Conventions
- **Auth:** ทุก route (ยกเว้น `@Public`) ต้องมี `Authorization: Bearer <accessToken>`
- **Workspace scope:** route ที่ผูกกับ workspace ต้องส่ง header `X-Workspace-Id: <workspace publicId>`
- **Envelope:** สำเร็จ → `{ "success": true, "data": ... }`; error → `{ "success": false, "error": { "code", "message" } }`
- **เงิน:** หน่วยเป็น **สตางค์** (BigInt → string) — แปลงเป็นบาท ÷ 100 ตอนแสดงผล

---

## Role Permission Matrix

DB enum `owner / admin / member` แสดงผลเป็น **Owner / Manager / Staff**

| Permission | Owner | Manager | Staff |
|------------|:-----:|:-------:|:-----:|
| `workspace.manage` (rename/delete/settings) | ✅ | – | – |
| `billing.manage` (เปลี่ยนแพ็กเกจ) | ✅ | – | – |
| `team.view` (ดูสมาชิก) | ✅ | ✅ | ✅ |
| `team.manage` (เชิญ/ลบ/เปลี่ยน role) | ✅ | ✅¹ | – |
| `wallet.manage`, `category.manage` | ✅ | ✅ | – |
| `transaction.create` | ✅ | ✅ | ✅ |
| `transaction.update.any` / `delete.any` | ✅ | ✅ | –² |
| `report.view`, `dashboard.business.view` | ✅ | ✅ | – |
| `activity.view` | ✅ | ✅ | – |
| `ai.insights.view` | ✅ | ✅³ | – |

¹ Manager จัดการได้เฉพาะ **Staff** (เชิญ/ลบ Staff เท่านั้น); เปลี่ยน role = **Owner only**
² Staff แก้/ลบได้เฉพาะรายการ **ที่ตัวเองสร้าง** (row-level ใน service)
³ ต้องมี plan feature `aiInsights` (Premium) ด้วย

Enforcement layers (NestJS guards): `WorkspaceGuard` → `BusinessGuard` (type=business) → `PermissionGuard` (`@RequirePermission`) → `subscriptions.assertFeature` (plan)

---

## Team & Invitations

| Method | Endpoint | สิทธิ์ |
|--------|----------|--------|
| `GET` | `/team/members` | team.view (ทุก role) |
| `GET` | `/team/invitations` | team.manage |
| `POST` | `/team/invitations` `{ email, role }` | team.manage |
| `DELETE` | `/team/invitations/:publicId` | team.manage |
| `PATCH` | `/team/members/:publicId/role` `{ role }` | Owner only |
| `DELETE` | `/team/members/:publicId` | team.manage (Manager→Staff เท่านั้น) |
| `GET` | `/invitations/:token` (preview) | login (ไม่ต้องเป็นสมาชิก) |
| `POST` | `/invitations/accept` `{ token }` | login |

## Activity Log
| Method | Endpoint | Query | สิทธิ์ |
|--------|----------|-------|--------|
| `GET` | `/activity` | `cursor`, `limit`, `action` | activity.view |

## Business Dashboard & Reports
| Method | Endpoint | Gate |
|--------|----------|------|
| `GET` | `/business/dashboard` | business · `businessDashboard` · dashboard.business.view |
| `GET` | `/business/reports/revenue` | business · `businessReports` · report.view |
| `GET` | `/business/reports/expenses` | ″ |
| `GET` | `/business/reports/profit` | ″ |
| `GET` | `/business/reports/export/pdf` | ″ |
| `GET` | `/business/reports/export/excel` | ″ |
| `GET` | `/business/insights` | business · `aiInsights` (Premium) · ai.insights.view |

Reports query: `period=this_month|last_month|custom_range` (+ `dateFrom`, `dateTo` เมื่อ custom)
Export query: `report=revenue|expenses|profit` + period params

## Subscriptions
| Method | Endpoint |
|--------|----------|
| `GET` | `/subscriptions/plans` |
| `GET` | `/subscriptions/current` |
| `POST` | `/subscriptions/change-plan` `{ plan }` |
| `POST` | `/subscriptions/cancel` |

## Error codes ที่ frontend จัดการพิเศษ
| Code | ความหมาย | UI |
|------|----------|-----|
| `PLAN_LIMIT_*` | ชนเพดาน (wallets/transactions/members/workspaces) | เปิด LimitReachedModal อัตโนมัติ |
| `PLAN_FEATURE_REQUIRED` / `PLAN_FEATURE_TEAM` | plan ไม่รองรับฟีเจอร์ | FeatureGate upgrade card |
| `WORKSPACE_NOT_BUSINESS` | เรียก business API จาก personal ws | FeatureGate business card |
