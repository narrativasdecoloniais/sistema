import { NextResponse } from "next/server";

export function middleware(request) {
  const temSessao =
    request.cookies.has("access_token") || request.cookies.has("refresh_token");

  if (!temSessao) {
    // Volta pra mesma página depois do login (ex.: "Inscreva-se" da home).
    const url = new URL("/login", request.url);
    url.searchParams.set("destino", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/participante/:path*", "/admin/:path*"],
};
