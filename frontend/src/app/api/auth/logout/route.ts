import { NextResponse } from "next/server"
import { getRefreshToken, clearAuthCookies } from "@/lib/auth-cookies"

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"

export async function POST() {
  const refreshToken = await getRefreshToken()

  if (refreshToken) {
    await fetch(`${AUTH_SERVICE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {})
  }

  await clearAuthCookies()
  return NextResponse.json({ ok: true })
}
