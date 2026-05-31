import Link from "next/link"
import { Ticket, Calendar, MapPin, ChevronRight } from "lucide-react"
import { formatDateShort } from "@/lib/utils"
import { getAccessToken, getUserIdFromToken } from "@/lib/auth-cookies"
import { redirect } from "next/navigation"

const BOOKING_SERVICE =
  process.env.BOOKING_SERVICE_URL ?? "http://localhost:8020"
const EVENT_SERVICE =
  process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"

interface BookingRaw {
  id: string
  event_id: string
  seat_id: string
  status: string
  created_at: string
}

interface EventSnippet {
  id: string
  title: string
  venue: string
  city: string
  date_from: string
  image_url?: string
}

async function getBookings(token: string): Promise<BookingRaw[]> {
  const userId = getUserIdFromToken(token)
  if (!userId) return []
  try {
    const res = await fetch(`${BOOKING_SERVICE}/bookings`, {
      headers: { "X-User-Id": userId },
      cache: "no-store",
    })
    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

async function getEventSnippets(ids: string[]): Promise<Map<string, EventSnippet>> {
  const map = new Map<string, EventSnippet>()
  await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${EVENT_SERVICE}/api/events/${id}`, {
          next: { revalidate: 300 },
        })
        if (res.ok) {
          const data = await res.json()
          map.set(id, data)
        }
      } catch {}
    })
  )
  return map
}

export default async function BookingsPage() {
  const token = await getAccessToken()
  if (!token) redirect("/login")

  const bookings = await getBookings(token)
  const uniqueEventIds = [...new Set(bookings.map((b) => b.event_id))]
  const events = await getEventSnippets(uniqueEventIds)

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#111827] mb-6">Minhas Reservas</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-12 text-center">
            <Ticket className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
            <p className="font-semibold text-[#374151] mb-2">Nenhuma reserva ainda</p>
            <p className="text-sm text-[#9ca3af] mb-6">
              Explore os eventos disponíveis e compre seus ingressos.
            </p>
            <Link
              href="/events"
              className="inline-block bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-[8px] text-sm transition-colors"
            >
              Ver eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const event = events.get(booking.event_id)
              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="bg-white rounded-[8px] border border-[#e5e7eb] p-4 flex items-center gap-4 hover:border-[#2563EB]/40 hover:shadow-sm transition-all"
                >
                  {/* Event image */}
                  <div className="w-16 h-16 rounded-[6px] overflow-hidden shrink-0 bg-gradient-to-br from-blue-900 to-indigo-900">
                    {event?.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111827] truncate">
                      {event?.title ?? "Evento"}
                    </p>
                    {event && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[#6b7280]">
                          <Calendar className="w-3 h-3" />
                          {formatDateShort(event.date_from)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#6b7280]">
                          <MapPin className="w-3 h-3" />
                          {event.city}
                        </span>
                      </div>
                    )}
                    <StatusBadge status={booking.status} />
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#9ca3af] shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Confirmado", cls: "text-green-700 bg-green-50" },
    reserved: { label: "Reservado", cls: "text-blue-700 bg-blue-50" },
    cancelled: { label: "Cancelado", cls: "text-red-700 bg-red-50" },
  }
  const { label, cls } = cfg[status] ?? { label: status, cls: "text-gray-700 bg-gray-50" }
  return (
    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}
