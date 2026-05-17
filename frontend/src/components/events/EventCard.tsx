import Link from "next/link"
import { MapPin, Calendar } from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import type { Event } from "@/types"

interface EventCardProps {
  event: Event
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`} className={cn("block group", className)}>
      <div className="bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden transition-shadow group-hover:shadow-md">
        {/* Image com overlay */}
        <div className="relative h-48 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
          {/* Gradiente overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Badge de categoria */}
          <span className="absolute top-3 left-3 bg-[#2563EB] text-white text-xs font-semibold px-2 py-1 rounded-[4px] uppercase tracking-wide">
            {event.category}
          </span>

          {/* Título e artista na base da imagem */}
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-bold text-sm leading-tight line-clamp-1">
              {event.title}
            </p>
            <p className="text-white/80 text-xs mt-0.5 line-clamp-1">
              {event.artist}
            </p>
          </div>
        </div>

        {/* Rodapé do card */}
        <div className="px-3 py-3 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1 text-[#6b7280] text-xs">
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="truncate">{formatDateShort(event.date)}</span>
            </div>
            <div className="flex items-center gap-1 text-[#6b7280] text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{event.city}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] text-[#6b7280]">A partir de</p>
            <p className="text-[#2563EB] font-bold text-sm">
              {formatCurrency(event.minPrice)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
