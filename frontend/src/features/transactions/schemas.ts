import { z } from "zod";

/** ฟอร์มใช้บาท (number) — แปลงเป็นสตางค์ตอน submit */
export const transactionFormSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
    walletId: z.string().uuid("เลือกกระเป๋าเงิน"),
    destinationWalletId: z.string().uuid().optional().or(z.literal("")),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    note: z.string().max(1000).optional(),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "เลือกวันที่"),
  })
  .superRefine((d, ctx) => {
    if (d.type === "transfer") {
      if (!d.destinationWalletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationWalletId"],
          message: "เลือกกระเป๋าปลายทาง",
        });
      } else if (d.destinationWalletId === d.walletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationWalletId"],
          message: "ปลายทางต้องไม่ใช่กระเป๋าเดียวกัน",
        });
      }
    } else if (!d.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "เลือกหมวดหมู่",
      });
    }
  });

export type TransactionFormInput = z.infer<typeof transactionFormSchema>;
