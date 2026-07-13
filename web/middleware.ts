import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/feed", "/messages", "/events", "/profile", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("access_token")?.value;
  const isLoggedIn = Boolean(token);

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthPage  = AUTH_PAGES.some(p => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/feed", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
