import Image from "next/image";

import { APP_NAME } from "@/lib/constants";

/** Layout สำหรับหน้า auth — จัดกลางจอ, สไตล์ minimal premium */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt={APP_NAME}
            width={320}
            height={320}
            priority
            className="h-36 w-auto object-contain"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
