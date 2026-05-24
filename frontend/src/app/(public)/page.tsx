import { HeroCarousel } from "@/components/home/HeroCarousel"
import { CategorySection } from "@/components/home/CategoryPills"
import { mapApiEvent } from "@/lib/utils"

const EVENT_SERVICE = process.env.EVENT_SERVICE_URL ?? "http://localhost:8080"

async function getEvents() {
  try {
    const res = await fetch(`${EVENT_SERVICE}/api/events?limit=18`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    const items = data.data ?? data.events ?? data ?? []
    return Array.isArray(items) ? items.map(mapApiEvent) : []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const events = await getEvents()
  return (
    <div>
      <HeroCarousel events={events.slice(0, 5)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <CategorySection allEvents={events} />
      </div>
    </div>
  )
}
