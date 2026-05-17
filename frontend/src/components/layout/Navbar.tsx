"use client"

import Link from "next/link"
import { Search, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Ticket className="w-6 h-6 text-[#2563EB]" />
          <span className="font-bold text-[#111827] text-lg">Ticketify</span>
        </Link>

        {/* Search bar centralizada */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Buscar eventos, artistas, locais..."
              className="w-full pl-9 pr-4 h-10 rounded-[8px] border border-[#e5e7eb] bg-[#f3f4f6] text-sm text-[#111827] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
          </div>
        </div>

        {/* Controles à direita */}
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
