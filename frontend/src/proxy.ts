import { NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = ["/profile", "/bookings", "/checkout"]
const ADMIN_ROUTES = ["/admin"]
const AUTH_ROUTES = ["/login", "/register"]
const SEATS_RE = /^\/events\/[^/]+\/seats(\/|$)/

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get("access_token")?.value
  const isAuthenticated = !!accessToken

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const isProtected =
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) ||
    ADMIN_ROUTES.some((r) => pathname.startsWith(r)) ||
    SEATS_RE.test(pathname)

  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/bookings/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/events/:id/seats/:path*",
    "/login",
    "/register",
  ],
}
