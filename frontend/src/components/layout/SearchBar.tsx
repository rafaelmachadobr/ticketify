"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
      setOpen((data.suggestions ?? []).length > 0)
    } catch {
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSelect(suggestion: string) {
    setQuery(suggestion)
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  return (
    <div ref={containerRef} className="flex-1 max-w-xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Buscar eventos, artistas, locais..."
            className="w-full pl-9 pr-4 h-10 rounded-[8px] border border-[#e5e7eb] bg-[#f3f4f6] text-sm text-[#111827] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
        </div>
      </form>

      {open && (
        <ul className="absolute top-12 left-0 right-0 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-50 py-1">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#111827] hover:bg-[#f3f4f6] flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
