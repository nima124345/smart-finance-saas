import { NextRequest, NextResponse } from "next/server";

/**
 * Route protection ชั้นแรก (edge, coarse-grained)
 *  - มี cookie `sf-auth` (set ตอน login ใน Step 5) → ผ่าน
 *  - ไม่มี + เข้าหน้า protected → เด้งไป /login
 *  - มี + เข้าหน้า auth → เด้งไป /dashboard
 *
 * หมายเหตุ: token จริงเก็บใน localStorage (Zustand). Step 5 จะ sync flag ลง cookie
 * เพื่อให้ middleware อ่านได้. ส่วน role-based (admin) ตรวจละเอียดที่ client AuthGuard.
 */
const AUTH_COOKIE = "sf-auth";
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAuth = req.cookies.has(AUTH_COOKIE);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasAuth && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (hasAuth && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // ครอบทุก route ยกเว้น static/api ภายใน
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
