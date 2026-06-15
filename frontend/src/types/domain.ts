/** Domain types — สะท้อน Prisma enums/models ของ backend (ใช้ publicId เป็น id ฝั่ง client) */

export type WorkspaceType = "personal" | "business";
export type WalletType = "cash" | "bank" | "ewallet" | "other";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type MembershipRole = "owner" | "admin" | "member";
export type SystemRole = "user" | "admin";
export type PlanCode = "free" | "pro" | "premium";

export interface User {
  publicId: string;
  name: string;
  email: string;
  systemRole: SystemRole;
}

export interface Workspace {
  publicId: string;
  name: string;
  type: WorkspaceType;
  baseCurrency: string;
  role: MembershipRole; // role ของ user ปัจจุบันใน workspace นี้
}

export interface Wallet {
  publicId: string;
  name: string;
  type: WalletType;
  currency: string;
  balance: string; // satang (BigInt → string)
}

export interface Category {
  publicId: string;
  name: string;
  type: CategoryType;
  isSystem: boolean;
  icon?: string;
  color?: string;
}

export interface Transaction {
  publicId: string;
  type: TransactionType;
  amount: string; // satang
  currency: string;
  note?: string;
  transactionDate: string;
  wallet: Pick<Wallet, "publicId" | "name">;
  destinationWallet?: Pick<Wallet, "publicId" | "name">;
  category?: Pick<Category, "publicId" | "name">;
}
