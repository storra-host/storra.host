import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { pathname, searchParams } = request.nextUrl;
  requestHeaders.set("x-pathname", pathname);
  if (pathname.startsWith("/v/") && searchParams.get("embed") === "1") {
    requestHeaders.set("x-embed-mode", "1");
  }
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
