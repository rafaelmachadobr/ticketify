"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react"
import type { Event } from "@/types"
import { formatDateShort, formatCurrency } from "@/lib/utils"

const PLACEHOLDER_GRADIENTS = [
  "from-blue-900 via-blue-800 to-indigo-900",
  "from-purple-900 via-purple-800 to-pink-900",
  "from-gray-900 via-gray-800 to-slate-900",
]

interface HeroCarouselProps {
  events: Event[]
}

export function HeroCarousel({ events }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent((c) => (c + 1) % events.length), [events.length])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + events.length) % events.length), [events.length])

  useEffect(() => {
    if (paused || events.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [paused, next, events.length])

  if (events.length === 0) return null

  const event = events[current]
  const gradient = PLACEHOLDER_GRADIENTS[current % PLACEHOLDER_GRADIENTS.length]

  return (
    <div
      className="relative w-full h-[480px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image or gradient */}
      {event.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${event.imageUrl})` }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-all duration-700`} />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-lg">
            <span className="inline-block bg-[#2563EB] text-white text-xs font-bold px-3 py-1 rounded-[4px] uppercase tracking-widest mb-4">
              Mega Evento
            </span>
            <h1 className="text-4xl font-bold text-white leading-tight mb-2">
              {event.title}
            </h1>
            {event.artist && (
              <p className="text-white/80 text-lg mb-4">{event.artist}</p>
            )}
            <div className="flex items-center gap-4 text-white/70 text-sm mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDateShort(event.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.venue}, {event.city}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/events/${event.id}`}
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-[8px] transition-colors"
              >
                Ver Evento
              </Link>
              <span className="text-white/60 text-sm">
                A partir de{" "}
                <span className="text-white font-bold">{formatCurrency(event.minPrice)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {events.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-white w-6" : "bg-white/50"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
