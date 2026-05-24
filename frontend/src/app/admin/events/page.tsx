import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { mapApiEvent, formatDateShort } from "@/lib/utils"

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"

async function getAdminEvents() {
  try {
    const res = await fetch(`${EVENT_SERVICE}/api/events?limit=100`, { cache: "no-store" })
    if (!res.ok) return []
    const data = await res.json()
    const items = data.data ?? data.events ?? data ?? []
    return Array.isArray(items) ? items.map(mapApiEvent) : []
  } catch {
    return []
  }
}

export const metadata = { title: "Eventos — Admin Ticketify" }

export default async function AdminEventsPage() {
  const events = await getAdminEvents()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Eventos</h1>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-[8px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </Link>
      </div>

      <div className="bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="text-left px-4 py-3 font-semibold text-[#374151]">Título</th>
              <th className="text-left px-4 py-3 font-semibold text-[#374151] hidden sm:table-cell">Data</th>
              <th className="text-left px-4 py-3 font-semibold text-[#374151] hidden md:table-cell">Local</th>
              <th className="text-left px-4 py-3 font-semibold text-[#374151] hidden lg:table-cell">Categoria</th>
              <th className="text-right px-4 py-3 font-semibold text-[#374151]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#9ca3af]">
                  Nenhum evento cadastrado.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {event.imageUrl ? (
                        <div
                          className="w-10 h-10 rounded-[6px] bg-cover bg-center shrink-0 hidden sm:block"
                          style={{ backgroundImage: `url(${event.imageUrl})` }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-[6px] bg-[#e5e7eb] shrink-0 hidden sm:block" />
                      )}
                      <span className="font-medium text-[#111827] line-clamp-1">{event.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6b7280] hidden sm:table-cell">
                    {formatDateShort(event.date)}
                  </td>
                  <td className="px-4 py-3 text-[#6b7280] hidden md:table-cell">
                    {event.city}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="inline-block bg-[#eff6ff] text-[#2563EB] text-xs font-medium px-2 py-1 rounded-[4px]">
                      {event.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:text-blue-700 font-medium transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
