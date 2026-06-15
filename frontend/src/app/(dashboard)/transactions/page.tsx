import type { Metadata } from "next";

import { TransactionsView } from "@/features/transactions/components/transactions-view";

export const metadata: Metadata = { title: "รายการ" };

export default function TransactionsPage() {
  return <TransactionsView />;
}
