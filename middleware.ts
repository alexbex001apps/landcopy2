import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/", "/login", "/precios"];
  const isPublic = publicPaths.some(p => pathname === p) || pathname.startsWith("/api") || pathname.startsWith("/_next");

  if (isPublic) return NextResponse.next();

  // Buscar cualquier cookie de Supabase
  const hasSupa = [...req.cookies.getAll()].some(c => c.name.startsWith("sb-"));

  if (!hasSupa) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};