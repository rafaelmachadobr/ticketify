import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, Ticket, CheckCircle, Clock, XCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { formatDateLong, formatTime } from "@/lib/utils"
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

export default async function BookingDetailPage({
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

  const statusConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    confirmed: { label: "Confirmado", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    reserved:  { label: "Reservado",  icon: <Clock className="w-5 h-5 text-blue-500" /> },
    cancelled: { label: "Cancelado",  icon: <XCircle className="w-5 h-5 text-red-500" /> },
  }
  const { label: statusLabel, icon: statusIcon } =
    statusConfig[booking.status] ?? { label: booking.status, icon: null }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/bookings"
          className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Minhas Reservas
        </Link>

        <h1 className="text-xl font-bold text-[#111827] mb-6">Detalhe da Reserva</h1>

        {/* Ticket card */}
        <div className="bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden mb-4">
          <div className="bg-[#2563EB] px-6 py-4">
            <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
              <Ticket className="w-3.5 h-3.5" />
              Ingresso
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">
              {event?.title ?? "Evento"}
            </h2>
          </div>

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

            <div className="border-t border-[#e5e7eb] pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#9ca3af] font-semibold uppercase tracking-wide">
                  Status
                </span>
                <div className="flex items-center gap-1.5">
                  {statusIcon}
                  <span className="text-sm font-semibold text-[#111827]">
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code section */}
            <div className="border-t border-dashed border-[#e5e7eb] pt-4">
              <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold mb-3">
                QR Code do ingresso
              </p>
              <div className="flex flex-col items-center gap-3">
                <QRCodeDisplay value={booking.id} />
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
        </div>

        <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-4 text-xs text-[#9ca3af]">
          <p>ID da reserva: <span className="font-mono text-[#374151]">{booking.id}</span></p>
          <p className="mt-1">Criado em: {new Date(booking.created_at).toLocaleString("pt-BR")}</p>
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

function QRCodeDisplay({ value }: { value: string }) {
  return (
    <div className="p-3 border border-[#e5e7eb] rounded-[6px] bg-white">
      <QRCodeSVG value={value} size={140} />
    </div>
  )
}
