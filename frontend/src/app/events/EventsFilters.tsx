"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const CATEGORIES = ["Shows", "Teatro", "Esportes", "Stand-up", "Festivais"]

interface EventsFiltersProps {
  activeCategory?: string
  activeCity?: string
}

export function EventsFilters({ activeCategory, activeCity }: EventsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`/events?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[#374151] mb-3">Categoria</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter("category", undefined)}
            className={`w-full text-left text-sm px-3 py-2 rounded-[6px] transition-colors ${
              !activeCategory
                ? "bg-[#eff6ff] text-[#2563EB] font-medium"
                : "text-[#6b7280] hover:bg-[#f9fafb]"
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter("category", activeCategory === cat ? undefined : cat)}
              className={`w-full text-left text-sm px-3 py-2 rounded-[6px] transition-colors ${
                activeCategory === cat
                  ? "bg-[#eff6ff] text-[#2563EB] font-medium"
                  : "text-[#6b7280] hover:bg-[#f9fafb]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#374151] mb-3">Cidade</h3>
        <input
          type="text"
          placeholder="Filtrar por cidade..."
          defaultValue={activeCity ?? ""}
          className="w-full text-sm border border-[#e5e7eb] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilter("city", (e.target as HTMLInputElement).value || undefined)
            }
          }}
        />
      </div>
    </div>
  )
}
