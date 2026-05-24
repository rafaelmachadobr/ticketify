import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
const MONTHS_LONG = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]
const WEEKDAYS = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"]

export function formatCurrency(value: number): string {
  if (!value || isNaN(value)) return "—"
  return "R$ " + value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function formatDateShort(dateString: string): string {
  if (!dateString) return "—"
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return "—"
  return `${d.getUTCDate().toString().padStart(2, "0")} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatTime(dateString: string): string {
  if (!dateString) return "—"
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return "—"
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
}

export function formatDateLong(dateString: string): string {
  if (!dateString) return "—"
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return "—"
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate().toString().padStart(2, "0")} de ${MONTHS_LONG[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

export interface Event {
  id: string
  title: string
  artist: string
  category: string
  date: string
  time: string
  venue: string
  city: string
  imageUrl: string
  minPrice: number
  description: string
  availableSeats?: number
}

export function mapApiEvent(api: Record<string, unknown>): Event {
  return {
    id: api.id as string,
    title: api.title as string,
    artist: (api.artist as string) ?? "",
    category: api.category as string,
    date: (api.date_from as string) ?? (api.date as string) ?? "",
    time: (api.date_from as string) ?? (api.time as string) ?? "",
    venue: api.venue as string,
    city: api.city as string,
    imageUrl: (api.image_url as string) ?? "",
    minPrice: parseFloat(String((api.min_price ?? api.minPrice) ?? "0")) || 0,
    description: (api.description as string) ?? "",
    availableSeats: (api.available_seats as number) ?? (api.availableSeats as number),
  }
}
