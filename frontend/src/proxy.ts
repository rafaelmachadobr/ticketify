import { NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = ["/profile", "/bookings", "/checkout"]
const ADMIN_ROUTES = ["/admin"]
const AUTH_ROUTES = ["/login", "/register"]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get("access_token")?.value
  const isAuthenticated = !!accessToken

  // Redireciona usuário autenticado para fora das páginas de auth
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Protege rotas autenticadas
  if (!isAuthenticated && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rotas admin — a verificação de role é feita no servidor
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/bookings/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
}
