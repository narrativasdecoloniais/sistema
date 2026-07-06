import { NextResponse } from "next/server";

export function middleware(request) {
  const temSessao =
    request.cookies.has("access_token") || request.cookies.has("refresh_token");

  if (!temSessao) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/participante/:path*", "/admin/:path*"],
};
