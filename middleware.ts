import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session";

const PUBLIC_PATHS = ["/login"];
const ADMIN_PATHS = ["/users"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = decodeSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const landing = session.role === "Admin" ? "/dashboard" : "/inventory";
    return NextResponse.redirect(new URL(landing, req.url));
  }

  if (matches(pathname, PUBLIC_PATHS)) {
    if (session) {
      const landing = session.role === "Admin" ? "/dashboard" : "/inventory";
      return NextResponse.redirect(new URL(landing, req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (matches(pathname, ADMIN_PATHS) && session.role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
