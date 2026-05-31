import Link from "next/link"
import { CheckCircle, Calendar, MapPin, Ticket, ArrowRight } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { formatCurrency, formatDateLong, formatTime } from "@/lib/utils"
import { getAccessToken, getUserIdFromToken } from "@/lib/auth-cookies"
import { redirect } from "next/navigation"

const BOOKING_SERVICE =
  process.env.BOOKING_SERVICE_URL ?? "http://localhost:8020"
const EVENT_SERVICE =
  process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"

async function getBooking(id: string, token: string) {
  const userId = getUserIdFromToken(token)
  if (!userId) return null
  try {
    const res = await fetch(`${BOOKING_SERVICE}/bookings/${id}`, {
      headers: { "X-User-Id": userId },
      cache: "no-store",
    })
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

async function getEvent(id: string) {
  try {
    const res = await fetch(`${EVENT_SERVICE}/api/events/${id}`, {
      next: { revalidate: 300 },
    })
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) redirect("/login")

  const booking = await getBooking(id, token)
  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#6b7280]">Reserva não encontrada.</p>
        <Link href="/bookings" className="text-[#2563EB] underline text-sm">
          Ver minhas reservas
        </Link>
      </div>
    )
  }

  const event = await getEvent(booking.event_id)

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Success icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Compra confirmada!</h1>
          <p className="text-[#6b7280] text-sm mt-1">
            Seu ingresso foi emitido com sucesso.
          </p>
        </div>

        {/* Ticket card */}
        <div className="bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden">
          {/* Ticket header */}
          <div className="bg-[#2563EB] px-6 py-4">
            <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
              <Ticket className="w-3.5 h-3.5" />
              Ingresso
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">
              {event?.title ?? "Evento"}
            </h2>
          </div>

          {/* Ticket body */}
          <div className="px-6 py-5 space-y-4">
            {event && (
              <>
                <InfoRow
                  icon={<Calendar className="w-4 h-4 text-[#2563EB]" />}
                  label="Data"
                  value={formatDateLong(event.date_from)}
                />
                <InfoRow
                  icon={<Calendar className="w-4 h-4 text-[#2563EB]" />}
                  label="Horário"
                  value={formatTime(event.date_from)}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4 text-[#2563EB]" />}
                  label="Local"
                  value={`${event.venue} · ${event.city}`}
                />
              </>
            )}

            <div className="border-t border-dashed border-[#e5e7eb] pt-4">
              <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold mb-3">
                QR Code do ingresso
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 border border-[#e5e7eb] rounded-[6px] bg-white">
                  <QRCodeSVG value={booking.id} size={140} />
                </div>
                <div className="bg-[#f3f4f6] rounded-[6px] px-4 py-2 w-full">
                  <code className="text-xs font-mono font-bold text-[#111827] tracking-widest break-all">
                    {booking.id.toUpperCase()}
                  </code>
                </div>
                <p className="text-xs text-[#9ca3af] text-center">
                  Apresente este QR code na entrada do evento
                </p>
              </div>
            </div>
          </div>

          {/* Ticket divider (perforated) */}
          <div className="relative flex items-center px-2">
            <div className="absolute -left-4 w-8 h-8 bg-[#f3f4f6] rounded-full border border-[#e5e7eb]" />
            <div className="flex-1 border-t border-dashed border-[#e5e7eb]" />
            <div className="absolute -right-4 w-8 h-8 bg-[#f3f4f6] rounded-full border border-[#e5e7eb]" />
          </div>

          {/* Ticket footer */}
          <div className="px-6 py-4 bg-[#fafafa] flex items-center justify-between text-xs text-[#6b7280]">
            <span>Reserva #{booking.id.slice(0, 8).toUpperCase()}</span>
            <span className="text-green-600 font-semibold">● Confirmado</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Link
            href="/bookings"
            className="flex-1 border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-[#374151] font-semibold text-sm py-3 rounded-[8px] text-center transition-colors"
          >
            Minhas reservas
          </Link>
          <Link
            href="/"
            className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-[8px] text-center transition-colors flex items-center justify-center gap-1.5"
          >
            Ver mais eventos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-[#9ca3af] font-semibold uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-[#111827]">{value}</p>
      </div>
    </div>
  )
}
