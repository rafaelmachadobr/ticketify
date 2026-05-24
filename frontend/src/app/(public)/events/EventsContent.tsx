import { EventCard } from "@/components/events/EventCard"
import { EventsFilters } from "./EventsFilters"
import { EventsPagination } from "./EventsPagination"
import { mapApiEvent } from "@/lib/utils"

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"
const PAGE_SIZE = 9

async function getEvents(params: { category?: string; city?: string; page?: string }) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    ...(params.category ? { category: params.category } : {}),
    ...(params.city ? { city: params.city } : {}),
  })
  try {
    const res = await fetch(`${EVENT_SERVICE}/api/events?${qs}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { events: [], total: 0, page: 1 }
    const data = await res.json()
    const items = data.data ?? data.events ?? []
    const total = data.total ?? data.meta?.total ?? items.length
    return { events: Array.isArray(items) ? items.map(mapApiEvent) : [], total, page }
  } catch {
    return { events: [], total: 0, page: 1 }
  }
}

export async function EventsContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; page?: string }>
}) {
  const params = await searchParams
  const { events, total, page } = await getEvents(params)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar de filtros */}
      <aside className="w-full lg:w-60 shrink-0">
        <EventsFilters activeCategory={params.category} activeCity={params.city} />
      </aside>

      {/* Grid */}
      <div className="flex-1">
        {events.length === 0 ? (
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-12 text-center">
            <p className="text-[#6b7280]">Nenhum evento encontrado.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#6b7280] mb-4">{total} evento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8">
                <EventsPagination currentPage={page} totalPages={totalPages} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
