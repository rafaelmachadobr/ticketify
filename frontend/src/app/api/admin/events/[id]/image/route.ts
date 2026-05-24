import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"

async function getRole(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_SERVICE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    const user = await res.json()
    return user.role ?? null
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  if (!accessToken) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const role = await getRole(accessToken)
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  try {
    const formData = await req.formData()
    const res = await fetch(`${EVENT_SERVICE}/api/events/${id}/image`, {
      method: "POST",
      headers: { "X-User-Role": "admin" },
      body: formData,
    })

    const text = await res.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      console.error(`[image-upload] Non-JSON response (${res.status}):`, text.slice(0, 300))
      return NextResponse.json({ message: "Erro interno no serviço de eventos." }, { status: 500 })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[image-upload] Error:", err)
    return NextResponse.json({ message: "Erro ao conectar com o serviço de eventos." }, { status: 500 })
  }
}
