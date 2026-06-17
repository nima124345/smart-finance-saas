# Backup & Recovery

## Backup (Supabase PostgreSQL)

### อัตโนมัติ
- Supabase ทำ **daily automated backup** (Pro plan เก็บ point-in-time recovery / PITR)
- ตรวจที่ **Dashboard → Database → Backups**

### Manual (ก่อน migration ใหญ่ / release)
```bash
# ใช้ DIRECT_URL (port 5432) — pg_dump ไม่รองรับ PgBouncer pooler
pg_dump "$DIRECT_URL" -Fc -f backup_$(date +%Y%m%d).dump

# เฉพาะ schema
pg_dump "$DIRECT_URL" --schema-only -f schema_$(date +%Y%m%d).sql
```

### แนะนำ
- Backup ก่อนรัน `prisma migrate deploy` บน prod ทุกครั้ง (โดยเฉพาะ migration ที่มี `ALTER TYPE`/drop column)
- เก็บ dump ไว้นอก Supabase (S3/Drive) อย่างน้อย 7 วันย้อนหลัง

## Recovery

### Restore เต็ม
```bash
pg_restore -d "$DIRECT_URL" --clean --if-exists backup_YYYYMMDD.dump
```

### Point-in-time (Supabase Pro)
- Dashboard → Database → Backups → **Restore** → เลือกเวลา

### หลัง restore
```bash
cd backend
railway run npx prisma migrate status   # ตรวจว่า schema ตรงกับ migrations
railway run npx prisma db seed          # idempotent — เติม plans/categories ถ้าหาย
```

## Disaster scenarios

| สถานการณ์ | การกู้ |
|-----------|--------|
| Migration ผิดพลาด | restore จาก dump ก่อน migrate แล้ว fix migration |
| ข้อมูลถูกลบ (bug) | record ส่วนใหญ่ **soft delete** (`deleted_at`) → กู้ได้โดย set `deleted_at = null`; ถ้า hard delete → PITR |
| Railway deployment ล่ม | **rollback ใน Railway dashboard** (อย่าใช้ `railway down` ตอน serve) |
| Vercel deploy เสีย | rollback to previous deployment ใน Vercel dashboard |
| Secret หลุด | rotate secret + redeploy; refresh tokens จะ invalid อัตโนมัติเมื่อเปลี่ยน `JWT_REFRESH_SECRET` |

## RPO/RTO เป้าหมาย (แนะนำ)
- **RPO** ≤ 24 ชม. (daily backup) — ลดเหลือนาทีด้วย PITR
- **RTO** ≤ 1 ชม. (restore + redeploy)
