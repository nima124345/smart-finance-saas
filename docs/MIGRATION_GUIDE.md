# Migration Guide

Smart Finance ใช้ **Prisma Migrate** (raw SQL migrations hand-reviewed) บน PostgreSQL

## หลักการ
- Schema source of truth = `backend/prisma/schema.prisma`
- Migrations อยู่ใน `backend/prisma/migrations/<timestamp>_<name>/migration.sql`
- Runtime ใช้ `DATABASE_URL` (pooled); migrate ใช้ `DIRECT_URL` (direct)
- **ห้าม** รัน `migrate deploy` ใน container boot path (ทำให้ Railway healthcheck flaky) — รันแยกเสมอ

## รัน migration บน production (Railway)
```bash
cd backend
railway run npx prisma migrate deploy   # apply เฉพาะ migration ที่ยังไม่ถูก apply
railway run npx prisma db seed          # idempotent: upsert plans + system categories
```

## Dev (local)
```bash
cd backend
npx prisma migrate dev --name <change>  # สร้าง + apply migration ใหม่ (ต้องมี shadow DB)
npx prisma generate
npm run db:seed
```

## สร้าง migration ใหม่เมื่อแก้ schema
1. แก้ `schema.prisma`
2. `npx prisma migrate dev --name <change>` (local) — Prisma gen SQL ให้, review ก่อน commit
3. commit ทั้ง `schema.prisma` + โฟลเดอร์ migration
4. deploy → `railway run npx prisma migrate deploy`

---

## Migration ล่าสุด: `20260617130000_business_workspace`

เพิ่มระบบ Business Workspace:
- `ALTER TYPE "PlanCode" ADD VALUE 'business'` (ระหว่าง pro/premium) — ปลอดภัยใน PG 12+
- `ALTER TABLE "plans" ADD COLUMN "max_members"`
- `CREATE TYPE "InvitationStatus"`
- `CREATE TABLE "workspace_invitations"` (คำเชิญทีมทางอีเมล + token hash)
- `CREATE TABLE "activity_logs"` (who created/edited/deleted — workspace-scoped)

**หลัง apply ต้อง re-seed** เพื่ออัปเดต plan features + maxMembers:
```bash
railway run npx prisma db seed
```
seed จะ upsert 4 แพ็กเกจ:

| Plan | ราคา/เดือน | maxMembers | features เด่น |
|------|-----------:|:----------:|---------------|
| free | ฿0 | 1 | – |
| pro | ฿99 | 1 | advancedDashboard, exportCsv |
| business | ฿299 | 10 | + teamMembers, businessDashboard, businessReports, activityLog |
| premium | ฿599 | ∞ | + aiInsights |

## Rollback
- Prisma ไม่มี auto-down migration — ต้องเขียน reverse SQL เอง หรือ restore จาก backup (ดู [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md))
- enum `ADD VALUE` **ย้อนไม่ได้** ตรงๆ (ต้อง recreate type) — วางแผนก่อน apply บน prod

## ตรวจสถานะ
```bash
railway run npx prisma migrate status   # ดู migration ที่ apply แล้ว/ค้าง
```
