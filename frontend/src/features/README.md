# Features (Feature-Based Structure)

แต่ละ feature คือ 1 โดเมน จัดไฟล์ตามหน้าที่ภายในตัวเอง (ไม่ปนกับ feature อื่น):

```
features/<feature>/
├── api/         # เลเยอร์เรียก backend (ใช้ @/lib/api/axios) — unwrap envelope
├── hooks/       # TanStack Query hooks (useX query/mutation) เชื่อม api + store
├── components/  # UI ของ feature นั้น (form, table, dialog, card)
└── types.ts     # type เฉพาะ feature (ถ้ามี — domain กลางอยู่ที่ @/types)
```

## Features ใน V1
| Feature | Step ที่ลงรายละเอียด |
|---------|----------------------|
| `auth`          | Step 5 (ตัวอย่างเต็มแล้ว: api + hooks) |
| `transactions`  | Step 6 (ตัวอย่าง api แล้ว) |
| `wallets`       | Step 6 |
| `categories`    | Step 6 |
| `dashboard`     | Step 7 |
| `subscriptions` | Step 8 |
| `admin`         | Step 8 |
| `settings`      | ถัดไป |

## กฎ
- ไม่เรียก `axios` ตรง — ผ่าน `@/lib/api/axios` เสมอ (interceptor จัดการ token + workspace header)
- ไม่ส่ง `workspaceId` เอง — axios แนบ `X-Workspace-Id` ให้อัตโนมัติ
- state ที่แชร์ข้ามหน้า → Zustand store (`@/stores`); server data → TanStack Query
