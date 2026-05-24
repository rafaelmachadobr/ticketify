import { Suspense } from "react"
import { EventsContent } from "./EventsContent"

export const metadata = {
  title: "Eventos — Ticketify",
}

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; page?: string }>
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Todos os Eventos</h1>
      <Suspense fallback={<EventsLoading />}>
        <EventsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

function EventsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-[8px] border border-[#e5e7eb] h-64 animate-pulse" />
      ))}
    </div>
  )
}
