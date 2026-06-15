# Transaction Engine API Contract (Step 6)

> ทุก endpoint = Bearer + `X-Workspace-Id` (WorkspaceGuard) · scope ด้วย workspaceId เสมอ
> เงิน = สตางค์ (BigInt→string) · วันที่ = `YYYY-MM-DD` (Asia/Bangkok)

## Wallets
```
GET    /wallets                 → [{ publicId, name, type, currency, balance(computed), isArchived }]
POST   /wallets                 { name, type, currency?, initialBalance?, color?, icon? }
GET    /wallets/:publicId       → wallet + balance
DELETE /wallets/:publicId       → soft delete (RESTRICT ถ้ามี txn → archive แทน)
```
balance = initialBalance + Σincome − Σexpense − Σtransfer_out + Σtransfer_in

## Categories
```
GET    /categories              → system (workspaceId=null) + custom ของ workspace
POST   /categories              { name, type(income|expense), icon?, color? }
DELETE /categories/:publicId    → soft delete (เฉพาะ custom; SET NULL บน txn)
```

## Transactions
```
GET /transactions               (cursor pagination)
  query: cursor?, limit=20, sort(latest|oldest|amount_high|amount_low),
         type?, walletId?, categoryId?, month(YYYY-MM)?, dateFrom?, dateTo?,
         amountMin?, amountMax?, search?
  → { items: Transaction[], nextCursor: string|null }

GET    /transactions/:publicId  → Transaction detail
POST   /transactions            (ดู body ล่าง)
PATCH  /transactions/:publicId  (แก้ได้: amount, note, categoryId, walletId, destinationWalletId, transactionDate; ห้ามเปลี่ยน type)
DELETE /transactions/:publicId  → soft delete
POST   /transactions/:publicId/restore → กู้คืน (internal)
```

### POST body
```jsonc
// income / expense
{ "type":"expense", "amount":15050, "walletId":"<uuid>", "categoryId":"<uuid>",
  "note":"กาแฟ", "transactionDate":"2026-06-15" }
// transfer
{ "type":"transfer", "amount":100000, "walletId":"<from-uuid>",
  "destinationWalletId":"<to-uuid>", "transactionDate":"2026-06-15" }
```

### Transaction (response)
```jsonc
{ "publicId":"...", "type":"expense", "amount":"15050", "currency":"THB",
  "note":"กาแฟ", "transactionDate":"2026-06-15",
  "wallet":{ "publicId":"...","name":"เงินสด" },
  "destinationWallet": null,
  "category":{ "publicId":"...","name":"อาหาร" } }
```

### Validation / Business rules
| กฎ | ผล |
|----|-----|
| amount ≤ 0 | 400 |
| type=transfer → destinationWalletId required, ≠ source, category=null | 400 |
| type=income/expense → categoryId required + category.type ตรงกับ type | 400 |
| wallet/category ข้าม workspace | 400 (resolve ไม่เจอ = กัน cross-tenant) |
| type เปลี่ยนตอน update | 400 |

## Dashboard (summary เบื้องต้น — reporting ใหญ่ไว้ Step 7)
```
GET /dashboard/summary?month=YYYY-MM
  → { totalIncome, totalExpense, net, walletCount, transactionCount }
GET /dashboard/charts?month=YYYY-MM
  → { categoryBreakdown:[{categoryId,name,type,total}], monthly:[{month,income,expense}] }
```
net = totalIncome − totalExpense (transfer = ย้ายภายใน ไม่นับ net)
