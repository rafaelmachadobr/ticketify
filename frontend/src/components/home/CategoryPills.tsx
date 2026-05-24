"use client"

import { useState } from "react"
import { EventCard } from "@/components/events/EventCard"
import type { Event } from "@/types"

const CATEGORIES = ["Todos", "Shows", "Teatro", "Esportes", "Stand-up", "Festivais"]

interface CategorySectionProps {
  allEvents: Event[]
}

export function CategorySection({ allEvents }: CategorySectionProps) {
  const [active, setActive] = useState("Todos")

  const filtered = active === "Todos" ? allEvents : allEvents.filter((e) => e.category === active)

  const featured = filtered.slice(0, 3)
  const trending = filtered.slice(3, 6)
  const upcoming = filtered.slice(6, 9)

  return (
    <div>
      {/* Pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              active === cat
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-white text-[#374151] border-[#e5e7eb] hover:border-[#2563EB] hover:text-[#2563EB]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sections */}
      <EventSection title="Mega Eventos" events={featured} />
      <EventSection title="Em Alta" events={trending} />
      <EventSection title="Próximos Eventos" events={upcoming} />
    </div>
  )
}

function EventSection({ title, events }: { title: string; events: Event[] }) {
  if (events.length === 0) return null
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-[#111827] mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((event, i) => (
          <EventCard key={event.id ?? i} event={event} />
        ))}
      </div>
    </section>
  )
}
