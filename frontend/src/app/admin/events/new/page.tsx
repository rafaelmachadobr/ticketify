import { EventFormWithPreview } from "@/components/admin/EventFormWithPreview"

export const metadata = { title: "Novo Evento — Admin Ticketify" }

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Novo Evento</h1>
      <EventFormWithPreview />
    </div>
  )
}
