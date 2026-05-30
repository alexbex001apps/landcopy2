import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/", "/login", "/precios", "/api"];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith("/api"));

  if (isPublic) return NextResponse.next();

  const token =
    req.cookies.get("sb-mrzkfethdxkfoostoaff-auth-token")?.value ||
    req.cookies.get("sb-access-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};