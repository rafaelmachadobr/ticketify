import { NextRequest, NextResponse } from "next/server"

const BOOKING_SERVICE =
  process.env.BOOKING_SERVICE_URL ?? "http://localhost:8020"

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("event_id")
  if (!eventId) {
    return NextResponse.json({ error: "event_id required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BOOKING_SERVICE}/bookings/reserved-seats?event_id=${eventId}`,
      { cache: "no-store" }
    )
    if (!res.ok) return NextResponse.json({ seat_ids: [] })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ seat_ids: [] })
  }
}
