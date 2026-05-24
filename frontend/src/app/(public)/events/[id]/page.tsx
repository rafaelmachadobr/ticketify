import {
  formatCurrency,
  formatDateLong,
  formatTime,
  mapApiEvent,
} from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080";

async function getEvent(id: string) {
  try {
    const res = await fetch(`${EVENT_SERVICE}/api/events/${id}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getEvent(id);
  if (!raw) notFound();

  const event = mapApiEvent(raw);
  const sections: {
    id: string;
    name: string;
    price: number;
    capacity: number;
  }[] = raw.seat_sections ?? [];

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Hero */}
      <div className="relative w-full h-72 md:h-80 overflow-hidden">
        {event.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        {/* Back + actions */}
        <div className="absolute top-4 left-0 right-0 max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <button className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Event info overlay */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-6">
          <span className="inline-block bg-[#2563EB] text-white text-xs font-bold px-3 py-1 rounded-[4px] uppercase tracking-widest mb-3">
            {event.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {event.title}
          </h1>
          {event.artist && (
            <p className="text-white/80 text-lg mt-1">{event.artist}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 3 Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <InfoCard
            icon={<Calendar className="w-5 h-5 text-[#2563EB]" />}
            label="Data"
            value={formatDateLong(event.date)}
          />
          <InfoCard
            icon={<Clock className="w-5 h-5 text-[#2563EB]" />}
            label="Horário"
            value={
              <>
                <span className="block">Início: {formatTime(event.date)}</span>
                {raw.gates_open && (
                  <span className="block text-xs text-[#9ca3af]">
                    Abertura: {formatTime(raw.gates_open)}
                  </span>
                )}
              </>
            }
          />
          <InfoCard
            icon={<MapPin className="w-5 h-5 text-[#2563EB]" />}
            label="Local"
            value={
              <>
                <span className="block">{event.venue}</span>
                <span className="block text-xs text-[#9ca3af]">
                  {event.city}
                </span>
              </>
            }
          />
        </div>

        {/* Layout: descrição + card sticky */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Descrição */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-6">
              <h2 className="text-lg font-bold text-[#111827] mb-4">
                Sobre o Evento
              </h2>
              {event.description ? (
                <p className="text-[#374151] leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              ) : (
                <p className="text-[#9ca3af]">Nenhuma descrição disponível.</p>
              )}
            </div>
          </div>

          {/* Card de compra sticky */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-5 lg:sticky lg:top-20">
              <p className="text-sm text-[#6b7280] mb-1">A partir de</p>
              <p className="text-3xl font-bold text-[#2563EB] mb-5">
                {formatCurrency(event.minPrice)}
              </p>

              {sections.length > 0 && (
                <div className="space-y-2 mb-5">
                  <p className="text-sm font-semibold text-[#374151]">
                    Setores
                  </p>
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between text-sm border border-[#e5e7eb] rounded-[6px] px-3 py-2"
                    >
                      <span className="text-[#374151]">{section.name}</span>
                      <span className="font-semibold text-[#111827]">
                        {formatCurrency(parseFloat(String(section.price)))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href={`/events/${event.id}/seats`}
                className="block w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-center py-3 rounded-[8px] transition-colors"
              >
                Comprar Ingressos
              </Link>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#9ca3af]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Compra 100% segura
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-4 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="text-sm font-medium text-[#111827]">{value}</div>
      </div>
    </div>
  );
}
