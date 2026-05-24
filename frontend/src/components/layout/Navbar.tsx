"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Ticket, User, ChevronDown, LogOut, Bookmark, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { SearchBar } from "@/components/layout/SearchBar"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleLogout() {
    await logout()
    setDropdownOpen(false)
    router.push("/")
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Ticket className="w-6 h-6 text-[#2563EB]" />
          <span className="font-bold text-[#111827] text-lg">Ticketify</span>
        </Link>

        {/* Search bar centralizada */}
        <SearchBar />

        {/* Controles à direita */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 h-10 px-3 rounded-[8px] hover:bg-[#f3f4f6] transition-colors text-sm font-medium text-[#111827]"
              >
                <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-[#6b7280]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-[8px] border border-[#e5e7eb] shadow-lg py-1 z-50">
                  <Link
                    href="/bookings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#f3f4f6]"
                  >
                    <Bookmark className="w-4 h-4 text-[#6b7280]" />
                    Minhas Reservas
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#f3f4f6]"
                  >
                    <UserCircle className="w-4 h-4 text-[#6b7280]" />
                    Perfil
                  </Link>
                  <div className="border-t border-[#e5e7eb] my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Criar conta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
