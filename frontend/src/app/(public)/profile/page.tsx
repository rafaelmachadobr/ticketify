"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const data = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message ?? "Erro ao atualizar perfil")
      }

      toast.success("Perfil atualizado com sucesso!")
    } catch (err: any) {
      toast.error("Erro ao atualizar perfil", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Meu Perfil</h1>

      <div className="max-w-lg">
        <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Nome completo
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={user.name}
                className="w-full h-10 px-3 rounded-[8px] border border-[#e5e7eb] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={user.email}
                className="w-full h-10 px-3 rounded-[8px] border border-[#e5e7eb] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
