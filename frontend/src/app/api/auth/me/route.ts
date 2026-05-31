import { NextResponse } from "next/server"
import { getAccessToken } from "@/lib/auth-cookies"

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"

export async function GET() {
  const token = await getAccessToken()
  if (!token) return NextResponse.json(null, { status: 401 })

  const res = await fetch(`${AUTH_SERVICE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!res.ok) return NextResponse.json(null, { status: 401 })
  try {
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json(null, { status: 401 })
  }
}
