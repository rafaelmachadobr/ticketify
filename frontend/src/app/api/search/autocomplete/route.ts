import { NextRequest, NextResponse } from "next/server"

const SEARCH_SERVICE = process.env.SEARCH_SERVICE_URL ?? "http://localhost:8000"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (!q) return NextResponse.json({ suggestions: [] })

  try {
    const res = await fetch(
      `${SEARCH_SERVICE}/search/autocomplete?q=${encodeURIComponent(q)}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return NextResponse.json({ suggestions: [] })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
