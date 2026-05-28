"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const data = new FormData(e.currentTarget)
    const email = data.get("email") as string
    const password = data.get("password") as string

    try {
      await login(email, password)
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
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Ticket className="w-7 h-7 text-[#2563EB]" />
              <span className="font-bold text-xl text-[#111827]">Ticketify</span>
            </Link>
          </div>

          <h1 className="text-xl font-semibold text-[#111827] text-center mb-6">
            Entrar na sua conta
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <PasswordInput
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-[#2563EB] hover:underline">
                Esqueci minha senha
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-[#2563EB] font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
