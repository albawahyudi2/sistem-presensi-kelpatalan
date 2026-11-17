import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PAGES = ["/login", "/admin/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isApi = pathname.startsWith("/api/");
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const go = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl));
  const deny = (status: 401 | 403, error: string) =>
    NextResponse.json({ error }, { status });

  if (!session?.user) {
    if (isPublicPage) return NextResponse.next();
    if (isApi) return deny(401, "Belum login");
    return go(isAdminArea ? "/admin/login" : "/login");
  }

  const { role, mustChangePassword } = session.user;

  if (role === "ADMIN") {
    if (!isAdminArea)
      return isApi ? deny(403, "Dilarang") : go("/admin/dashboard");
    if (pathname === "/admin/login") return go("/admin/dashboard");
    if (mustChangePassword && pathname !== "/admin/ganti-password") {
      return isApi
        ? deny(403, "Wajib ganti password")
        : go("/admin/ganti-password");
    }
    return NextResponse.next();
  }

  if (isAdminArea) return isApi ? deny(403, "Dilarang") : go("/");
  if (isPublicPage) return go("/");
  if (mustChangePassword && pathname !== "/ganti-password") {
    return isApi ? deny(403, "Wajib ganti password") : go("/ganti-password");
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/health|api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|json|webmanifest|js|html)$).*)",
  ],
};
