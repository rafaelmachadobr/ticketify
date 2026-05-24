import { NextRequest, NextResponse } from "next/server"

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const qs = searchParams.toString()
  const res = await fetch(`${EVENT_SERVICE}/api/events${qs ? `?${qs}` : ""}`, {
    next: { revalidate: 60 },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
