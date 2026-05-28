import { AdminShell } from "@/components/admin/AdminSidebar"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"

async function getAdminUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  if (!accessToken) return { notLoggedIn: true }
  try {
    const res = await fetch(`${AUTH_SERVICE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!res.ok) return { notLoggedIn: true }
    return await res.json()
  } catch {
    return { notLoggedIn: true }
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminUser()
  if (!user || user.notLoggedIn) redirect("/login?redirect=/admin")
  if (user.role !== "admin") redirect("/")

  return <AdminShell userName={user.name} userEmail={user.email}>{children}</AdminShell>
}
