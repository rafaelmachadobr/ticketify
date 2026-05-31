"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const EVENT_SERVICE =
  typeof window !== "undefined"
    ? "/events-api" // proxied via Next.js rewrites
    : (process.env.EVENT_SERVICE_URL ?? "http://localhost:8080")

interface SeatSection {
  id: string
  name: string
  price: number
  capacity: number
  seats?: SeatData[]
}

interface SeatData {
  id: string
  section_id: string
  label: string
  status: "available" | "reserved" | "sold" | "blocked"
}

interface EventData {
  id: string
  title: string
  venue: string
  city: string
  date_from: string
  seat_sections: SeatSection[]
  seats?: SeatData[]
}

type SeatStatus = "available" | "unavailable" | "blocked" | "selected"

interface DisplaySeat {
  id: string
  label: string
  status: SeatStatus
  sectionId: string
  price: number
}

export default function SeatsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventData | null>(null)
  const [seats, setSeats] = useState<DisplaySeat[]>([])
  const [selected, setSelected] = useState<DisplaySeat[]>([])
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${params.id}`).then((r) => r.json()),
      fetch(`/api/bookings/reserved-seats?event_id=${params.id}`)
        .then((r) => r.json())
        .catch(() => ({ seat_ids: [] })),
    ])
      .then(([data, reserved]: [EventData, { seat_ids: string[] }]) => {
        const reservedSet = new Set(reserved.seat_ids ?? [])
        setEvent(data)
        const display: DisplaySeat[] = []
        for (const section of data.seat_sections ?? []) {
          for (const s of section.seats ?? []) {
            display.push({
              id: s.id,
              label: s.label,
              status:
                s.status !== "available"
                  ? "unavailable"
                  : reservedSet.has(s.id)
                  ? "blocked"
                  : "available",
              sectionId: section.id,
              price: section.price,
            })
          }
        }
        setSeats(display)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const toggle = (seat: DisplaySeat) => {
    if (seat.status === "unavailable" || seat.status === "blocked") return
    setSeats((prev) =>
      prev.map((s) => {
        if (s.id !== seat.id) return s
        const next = s.status === "selected" ? "available" : "selected"
        return { ...s, status: next }
      })
    )
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === seat.id)
      return exists ? prev.filter((s) => s.id !== seat.id) : [...prev, seat]
    })
  }

  const handleReserve = async () => {
    if (selected.length === 0 || !event) return
    if (!user) {
      router.push(`/login?next=/events/${params.id}/seats`)
      return
    }
    setReserving(true)
    try {
      const seat = selected[0]
      const res = await fetch("/api/bookings/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id, seat_id: seat.id }),
      })
      if (res.status === 409) {
        toast.warning("Assento indisponível", {
          description: "Este assento acabou de ser reservado por outro usuário.",
        })
        return
      }
      if (!res.ok) throw new Error()
      const { token } = await res.json()
      toast.success("Assento reservado!", {
        description: "Você tem 7 minutos para concluir a compra.",
      })
      const sec = event.seat_sections.find((s) => s.id === seat.sectionId)
      const params = new URLSearchParams({
        event_id: event.id,
        seat: seat.label,
        section: sec?.name ?? "",
        price: String(seat.price),
      })
      router.push(`/checkout/${token}?${params.toString()}`)
    } catch {
      toast.error("Erro ao reservar", {
        description: "Tente novamente em instantes.",
      })
    } finally {
      setReserving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[#6b7280]">Evento não encontrado.</p>
        <Link href="/events" className="text-[#2563EB] underline text-sm">
          Ver eventos
        </Link>
      </div>
    )
  }

  const totalPrice = selected.reduce((sum, s) => sum + s.price, 0)

  // Group seats by section
  const sectionMap = new Map<string, DisplaySeat[]>()
  for (const s of seats) {
    const arr = sectionMap.get(s.sectionId) ?? []
    arr.push(s)
    sectionMap.set(s.sectionId, arr)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Minimal header */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href={`/events/${event.id}`}
            className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-[#111827] leading-tight truncate">
              {event.title}
            </p>
            <p className="text-xs text-[#6b7280] flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.venue} · {event.city}
            </p>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Seat map */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Stage indicator */}
          <div className="flex justify-center">
            <div className="bg-[#e5e7eb] rounded-[4px] px-8 py-2 text-xs font-semibold text-[#6b7280] uppercase tracking-widest">
              Palco / Arena
            </div>
          </div>

          {event.seat_sections.map((section) => {
            const sectionSeats = sectionMap.get(section.id) ?? []
            return (
              <div key={section.id} className="bg-white rounded-[8px] border border-[#e5e7eb] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#111827]">{section.name}</h3>
                  <span className="text-sm font-bold text-[#2563EB]">
                    {formatCurrency(section.price)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sectionSeats.map((seat) => (
                    <SeatButton key={seat.id} seat={seat} onClick={() => toggle(seat)} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Legend */}
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-4">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Legenda
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-[#374151]">
              <LegendItem color="bg-[#2563EB]" label="Disponível" />
              <LegendItem color="bg-[#16a34a]" label="Selecionado" />
              <LegendItem color="bg-[#e5e7eb]" label="Indisponível" />
              <LegendItem border label="Bloqueado" />
            </div>
          </div>
        </div>

        {/* Sidebar summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-5 lg:sticky lg:top-20">
            <h3 className="font-semibold text-[#111827] mb-4">Resumo da Seleção</h3>

            {selected.length === 0 ? (
              <p className="text-sm text-[#9ca3af] text-center py-6">
                Clique em um assento disponível para selecioná-lo
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {selected.map((s) => {
                  const sec = event.seat_sections.find((x) => x.id === s.sectionId)
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm border border-[#e5e7eb] rounded-[6px] px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-[#111827]">{sec?.name}</p>
                        <p className="text-xs text-[#6b7280]">Assento {s.label}</p>
                      </div>
                      <span className="font-semibold text-[#111827]">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {selected.length > 0 && (
              <div className="border-t border-[#e5e7eb] pt-3 mb-4">
                <div className="flex justify-between text-sm font-semibold text-[#111827]">
                  <span>Total</span>
                  <span className="text-[#2563EB]">{formatCurrency(totalPrice)}</span>
                </div>
                <p className="text-xs text-[#9ca3af] mt-1">
                  + taxa de conveniência calculada no checkout
                </p>
              </div>
            )}

            <button
              onClick={handleReserve}
              disabled={selected.length === 0 || reserving}
              className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-[8px] transition-colors text-sm"
            >
              {reserving ? "Reservando..." : "Reservar e Continuar"}
            </button>

            <p className="text-xs text-[#9ca3af] text-center mt-2">
              Você terá 7 minutos para concluir a compra
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SeatButton({
  seat,
  onClick,
}: {
  seat: DisplaySeat
  onClick: () => void
}) {
  const base =
    "w-9 h-9 rounded-[4px] text-xs font-bold flex items-center justify-center transition-all select-none"

  // Labels come as "SectionName-N" — show only the numeric suffix
  const display = seat.label.includes("-")
    ? seat.label.split("-").pop()!
    : seat.label

  if (seat.status === "available")
    return (
      <button
        title={seat.label}
        onClick={onClick}
        className={`${base} bg-[#2563EB] text-white hover:bg-blue-700 cursor-pointer`}
      >
        {display}
      </button>
    )
  if (seat.status === "selected")
    return (
      <button
        title={seat.label}
        onClick={onClick}
        className={`${base} bg-[#16a34a] text-white cursor-pointer ring-2 ring-[#16a34a] ring-offset-1`}
      >
        {display}
      </button>
    )
  if (seat.status === "blocked")
    return (
      <div
        title={seat.label}
        className={`${base} border-2 border-dashed border-[#d1d5db] text-[#9ca3af] cursor-not-allowed`}
      >
        {display}
      </div>
    )
  return (
    <div title={seat.label} className={`${base} bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed`}>
      {display}
    </div>
  )
}

function LegendItem({
  color,
  label,
  border,
}: {
  color?: string
  label: string
  border?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-4 h-4 rounded-[2px] ${color ?? ""} ${border ? "border-2 border-dashed border-[#d1d5db]" : ""}`}
      />
      <span>{label}</span>
    </div>
  )
}
