import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Always redirect from root to /presentation
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/presentation", request.url));
  }

  // Auth is disabled - redirect auth routes back to the app
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/presentation", request.url));
  }

  return NextResponse.next();
}

// Add routes that should be protected by authentication
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
