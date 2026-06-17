# Monitoring Guide

## Health checks
| Endpoint | ตอบ | ใช้ทำ |
|----------|-----|-------|
| `GET /api/v1/health` | `200` + `{ status, database, uptime }` | Railway healthcheck + uptime monitor |
| `GET /` | JSON API info | sanity check (นอก global prefix) |

ตั้ง external uptime monitor (UptimeRobot / BetterStack) ยิง `/api/v1/health` ทุก 1–5 นาที — **ยิง URL จริงเท่านั้น** (`smart-finance-saas-production-68ce.up.railway.app`)

## Logs
- **Railway:** `railway logs` หรือ dashboard → Deployments → Logs
  - bootstrap log ถูกลดเสียง (`logger: ['error','warn']` ตอน boot, เปิด `log` หลัง `listen()`)
- **Vercel:** dashboard → Deployments → Runtime/Build logs
- **Supabase:** dashboard → Logs (Postgres / API)

## Metrics ที่ควรเฝ้า
| ชั้น | Metric | สัญญาณอันตราย |
|------|--------|----------------|
| API | response time `/health` | TCP hang / 000 = edge ยัง propagate (รอ ~6 นาทีหลัง churn) |
| API | 5xx rate | พุ่ง = bug/DB down |
| API | 502 + `x-railway-fallback: true` | ยิงผิด domain (ไม่ใช่ของพัง) |
| DB | connection count | ใกล้ pool limit → ปรับ PgBouncer / ใช้ pooled URL |
| DB | slow queries | เพิ่ม index (มี index ครบ workspace-scoped แล้ว) |
| Business | rate limit 429 | ปรับ `THROTTLE_LIMIT` หรือเพิ่ม Redis |

## Application-level signals
- **Plan limit hit** → frontend เปิด LimitReachedModal (มาจาก `PLAN_LIMIT_*`) — ดูเป็น growth signal
- **Activity log** (`/activity`) = audit trail ของ business workspace (ใคร สร้าง/แก้/ลบ)
- **Admin dashboard** (`/admin`) — MRR / ARR / active users / growth

## Alerting (แนะนำ)
1. Uptime monitor → แจ้งเตือนเมื่อ `/health` ≠ 200 เกิน 2 รอบ
2. Railway → enable deploy failure / crash notifications
3. Supabase → enable DB resource alerts (CPU/disk/connections)

## Debug checklist เมื่อ API ล่ม
1. `railway status` — deployment Online?
2. `curl https://<api>/api/v1/health` — 200?
3. ถ้า TCP hang หลัง redeploy หลายรอบ → รอ edge propagate ~6 นาที
4. ตรวจ env (DB URL, JWT secrets) ครบไหม — boot จะ fail-fast ถ้าขาด
5. `railway logs` หา stack trace
