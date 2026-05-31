import { NextRequest, NextResponse } from "next/server"
import { getAccessToken, getUserIdFromToken } from "@/lib/auth-cookies"

const BOOKING_SERVICE = process.env.BOOKING_SERVICE_URL ?? "http://localhost:8020"

export async function POST(req: NextRequest) {
  const token = await getAccessToken()
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const userId = getUserIdFromToken(token)
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const res = await fetch(`${BOOKING_SERVICE}/bookings/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
