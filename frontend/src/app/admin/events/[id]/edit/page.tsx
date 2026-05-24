import { notFound } from "next/navigation"
import { EventFormWithPreview } from "@/components/admin/EventFormWithPreview"

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"

async function getEvent(id: string) {
  try {
    const res = await fetch(`${EVENT_SERVICE}/api/events/${id}`, { cache: "no-store" })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const metadata = { title: "Editar Evento — Admin Ticketify" }

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Editar Evento</h1>
      <EventFormWithPreview
        eventId={id}
        initialData={{
          title: event.title,
          venue: event.venue,
          city: event.city,
          category: event.category,
          date_from: event.date_from,
          date_to: event.date_to,
          gates_open: event.gates_open,
          description: event.description,
          published: event.published,
          image_url: event.image_url,
          seat_sections: event.seat_sections?.map((s: { name: string; capacity: number; price: string }) => ({
            name: s.name,
            capacity: String(s.capacity),
            price: String(parseFloat(s.price)),
          })),
        }}
      />
    </div>
  )
}

