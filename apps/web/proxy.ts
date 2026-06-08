import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/bio" ||
    pathname === "/offer" ||
pathname.startsWith("/offer/") ||
    pathname === "/r" ||
    pathname.startsWith("/r/") ||
    pathname === "/api/health" ||
    pathname === "/api/public/leads" ||
    pathname === "/api/cron/publish-telegram" ||
    pathname.startsWith("/api/auth/")
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (verifySessionToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set(
    "from",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};