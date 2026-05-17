import { NextRequest, NextResponse } from "next/server"
import { setAuthCookies } from "@/lib/auth-cookies"

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${AUTH_SERVICE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) return NextResponse.json(json, { status: res.status })

  await setAuthCookies(json.accessToken, json.refreshToken)
  return NextResponse.json({ user: json.user })
}
