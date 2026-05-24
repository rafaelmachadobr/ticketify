import { Footer } from "@/components/layout/Footer";
import { LayoutDashboard, LogOut, Ticket } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001";

async function getAdminUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return { notLoggedIn: true };
  try {
    const res = await fetch(`${AUTH_SERVICE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return { notLoggedIn: true };
    return await res.json();
  } catch {
    return { notLoggedIn: true };
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user || user.notLoggedIn) redirect("/login?redirect=/admin");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-[#e5e7eb] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#e5e7eb]">
          <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">
            Admin
          </p>
          <p className="text-sm font-medium text-[#111827] mt-1 truncate">
            {user.name}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem
            href="/admin"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
          />
          <NavItem
            href="/admin/events"
            icon={<Ticket className="w-4 h-4" />}
            label="Eventos"
          />
        </nav>
        <div className="p-3 border-t border-[#e5e7eb]">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#374151] px-3 py-2 rounded-[6px] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Voltar ao site
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-[#f3f4f6] overflow-y-auto flex flex-col">
        <div className="flex-1 p-6">{children}</div>
        <Footer />
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm text-[#374151] hover:bg-[#eff6ff] hover:text-[#2563EB] px-3 py-2 rounded-[6px] transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
