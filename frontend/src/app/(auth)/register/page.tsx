"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const data = new FormData(e.currentTarget)
    const password = data.get("password") as string
    const confirm = data.get("confirm") as string

    if (password !== confirm) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)
    try {
      await register(data.get("name") as string, data.get("email") as string, password)
      router.push("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Ticket className="w-7 h-7 text-[#2563EB]" />
              <span className="font-bold text-xl text-[#111827]">Ticketify</span>
            </Link>
          </div>

          <h1 className="text-xl font-semibold text-[#111827] text-center mb-6">
            Criar sua conta
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Nome completo
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full h-10 px-3 rounded-[8px] border border-[#e5e7eb] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent placeholder:text-[#9ca3af]"
                placeholder="Seu nome"
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
                autoComplete="email"
                className="w-full h-10 px-3 rounded-[8px] border border-[#e5e7eb] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent placeholder:text-[#9ca3af]"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Senha
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full h-10 px-3 rounded-[8px] border border-[#e5e7eb] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent placeholder:text-[#9ca3af]"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Confirmar senha
              </label>
              <input
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                className="w-full h-10 px-3 rounded-[8px] border border-[#e5e7eb] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent placeholder:text-[#9ca3af]"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-[#2563EB] font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
