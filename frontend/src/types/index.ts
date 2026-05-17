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
  description?: string
  availableSeats?: number
}

export interface SeatSection {
  id: string
  name: string
  price: number
  availableSeats: number
}

export interface Seat {
  id: string
  sectionId: string
  row: string
  number: number
  status: "available" | "unavailable" | "blocked" | "selected"
}

export interface Booking {
  id: string
  eventId: string
  event?: Event
  seatId: string
  seat?: Seat
  userId: string
  status: "reserved" | "confirmed" | "cancelled"
  createdAt: string
  token?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin"
}

export interface SearchResult {
  events: Event[]
  total: number
  page: number
  limit: number
}

export interface AutocompleteResult {
  suggestions: string[]
}
