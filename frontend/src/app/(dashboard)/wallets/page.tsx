import type { Metadata } from "next";

import { WalletsView } from "@/features/wallets/components/wallets-view";

export const metadata: Metadata = { title: "กระเป๋าเงิน" };

export default function WalletsPage() {
  return <WalletsView />;
}
