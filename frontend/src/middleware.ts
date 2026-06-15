import { NextRequest, NextResponse } from "next/server";

/**
 * Route protection ชั้นแรก (edge, coarse-grained)
 *  - /admin/login → เปิดได้เสมอ (ประตูแอดมิน)
 *  - /admin/*     → ต้องมี cookie sf-auth ไม่งั้นเด้ง /admin/login
 *                   (สิทธิ์ admin จริงตรวจที่ AdminPortalGuard + backend AdminGuard)
 *  - หน้า auth ผู้เช่า (login/register/...) → มี auth แล้วเด้ง /dashboard
 *  - หน้าอื่น (โซนผู้เช่า) → ไม่มี auth เด้ง /login
 */
const AUTH_COOKIE = "sf-auth";
const ADMIN_LOGIN = "/admin/login";
const TENANT_AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAuth = req.cookies.has(AUTH_COOKIE);

  // ── Admin Portal ──
  if (pathname === ADMIN_LOGIN) {
    return NextResponse.next(); // เปิดได้เสมอ
  }
  if (pathname.startsWith("/admin")) {
    if (!hasAuth) {
      const url = req.nextUrl.clone();
      url.pathname = ADMIN_LOGIN;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Tenant ──
  const isTenantAuth = TENANT_AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (!hasAuth && !isTenantAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  if (hasAuth && isTenantAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
