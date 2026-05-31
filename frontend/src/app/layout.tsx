import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import type { User } from "@/types"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Ticketify — Ingressos para os melhores eventos",
  description: "Compre ingressos para shows, teatro, esportes e muito mais.",
}

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"

async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) return null
  try {
    const res = await fetch(`${AUTH_SERVICE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialUser = await getSessionUser()

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="h-full bg-[#f3f4f6]" suppressHydrationWarning>
        <AuthProvider initialUser={initialUser}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
