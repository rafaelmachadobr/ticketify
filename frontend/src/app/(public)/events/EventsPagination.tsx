"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface EventsPaginationProps {
  currentPage: number
  totalPages: number
}

export function EventsPagination({ currentPage, totalPages }: EventsPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`/events?${params.toString()}`)
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  )

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-[6px] border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page, idx) => {
        const prev = pages[idx - 1]
        const showEllipsis = prev && page - prev > 1
        return (
          <span key={page} className="flex items-center gap-1">
            {showEllipsis && <span className="text-[#9ca3af] px-1">…</span>}
            <button
              onClick={() => goTo(page)}
              className={`min-w-[36px] h-9 px-3 rounded-[6px] border text-sm font-medium transition-colors ${
                page === currentPage
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
              }`}
            >
              {page}
            </button>
          </span>
        )
      })}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-[6px] border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
