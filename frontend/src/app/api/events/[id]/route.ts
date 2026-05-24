import { NextRequest, NextResponse } from "next/server"

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(`${EVENT_SERVICE}/api/events/${id}`, {
    next: { revalidate: 300 },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
