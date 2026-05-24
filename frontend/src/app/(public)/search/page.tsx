import { EventCard } from "@/components/events/EventCard"
import { EventsPagination } from "@/app/events/EventsPagination"
import { mapApiEvent } from "@/lib/utils"

const SEARCH_SERVICE = process.env.SEARCH_SERVICE_URL ?? "http://localhost:8000"
const PAGE_SIZE = 9

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    city?: string
    category?: string
    date_from?: string
    date_to?: string
    page?: string
  }>
}

async function searchEvents(params: Awaited<SearchPageProps["searchParams"]>) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
  if (params.q) qs.set("q", params.q)
  if (params.city) qs.set("city", params.city)
  if (params.category) qs.set("category", params.category)
  if (params.date_from) qs.set("date_from", params.date_from)
  if (params.date_to) qs.set("date_to", params.date_to)

  try {
    const res = await fetch(`${SEARCH_SERVICE}/search?${qs}`, { cache: "no-store" })
    if (!res.ok) return { events: [], total: 0, page }
    const data = await res.json()
    return {
      events: (data.data ?? []).map(mapApiEvent),
      total: data.total ?? 0,
      page,
    }
  } catch {
    return { events: [], total: 0, page }
  }
}

const CATEGORIES = ["Shows", "Teatro", "Esportes", "Stand-up", "Festivais"]

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const { events, total, page } = await searchEvents(params)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const q = params.q ?? ""

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">
          {q ? `Resultados para "${q}"` : "Todos os eventos"}
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          {total} evento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filtros */}
        <aside className="w-full lg:w-56 shrink-0 space-y-4">
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-4">
            <p className="text-sm font-semibold text-[#111827] mb-3">Categoria</p>
            <div className="space-y-1">
              <FilterLink
                label="Todas"
                href={buildUrl(params, { category: undefined, page: undefined })}
                active={!params.category}
              />
              {CATEGORIES.map((cat) => (
                <FilterLink
                  key={cat}
                  label={cat}
                  href={buildUrl(params, { category: cat, page: undefined })}
                  active={params.category === cat}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1">
          {events.length === 0 ? (
            <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-12 text-center">
              <p className="text-[#6b7280]">
                {q ? `Nenhum resultado para "${q}".` : "Nenhum evento encontrado."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {events.map((event: ReturnType<typeof mapApiEvent>) => (
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
    </div>
  )
}

function buildUrl(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const merged = { ...current, ...overrides }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") qs.set(k, v)
  }
  const str = qs.toString()
  return `/search${str ? `?${str}` : ""}`
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string
  href: string
  active: boolean
}) {
  return (
    <a
      href={href}
      className={`block px-3 py-1.5 rounded-[6px] text-sm transition-colors ${
        active
          ? "bg-[#eff6ff] text-[#2563EB] font-medium"
          : "text-[#374151] hover:bg-[#f3f4f6]"
      }`}
    >
      {label}
    </a>
  )
}
