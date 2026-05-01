import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  // Public routes — accessible without auth.
  const isPublic =
    path === "/" ||                          // landing page
    path.startsWith("/sage") ||              // free public audit dashboard
    path.startsWith("/api/audit/start") ||   // landing CTA endpoint
    path.startsWith("/api/auth") ||
    path.startsWith("/api/debug");

  const isAuthPage =
    path.startsWith("/login") || path.startsWith("/signup");

  if (isPublic) return NextResponse.next();

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/instagram/callback).*)"],
};
