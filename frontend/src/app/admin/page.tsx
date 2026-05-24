import Link from "next/link"
import { Ticket, Plus } from "lucide-react"

export const metadata = { title: "Admin — Ticketify" }

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/events"
          className="bg-white rounded-[8px] border border-[#e5e7eb] p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
        >
          <div className="w-12 h-12 bg-[#eff6ff] rounded-[8px] flex items-center justify-center">
            <Ticket className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="font-semibold text-[#111827]">Eventos</p>
            <p className="text-sm text-[#6b7280]">Gerenciar eventos</p>
          </div>
        </Link>
        <Link
          href="/admin/events/new"
          className="bg-white rounded-[8px] border border-[#e5e7eb] p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
        >
          <div className="w-12 h-12 bg-[#eff6ff] rounded-[8px] flex items-center justify-center">
            <Plus className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="font-semibold text-[#111827]">Novo Evento</p>
            <p className="text-sm text-[#6b7280]">Criar evento</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
