import Link from "next/link"
import { Ticket } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#e5e7eb] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Ticket className="w-5 h-5 text-[#2563EB]" />
              <span className="font-bold text-[#111827]">Ticketify</span>
            </Link>
            <p className="text-sm text-[#6b7280]">
              A melhor plataforma de ingressos do Brasil.
            </p>
          </div>

          {/* Eventos */}
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Eventos</h3>
            <ul className="space-y-2 text-sm text-[#6b7280]">
              <li><Link href="/events?category=shows" className="hover:text-[#2563EB]">Shows</Link></li>
              <li><Link href="/events?category=teatro" className="hover:text-[#2563EB]">Teatro</Link></li>
              <li><Link href="/events?category=esportes" className="hover:text-[#2563EB]">Esportes</Link></li>
              <li><Link href="/events?category=standup" className="hover:text-[#2563EB]">Stand-up</Link></li>
            </ul>
          </div>

          {/* Minha conta */}
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Minha conta</h3>
            <ul className="space-y-2 text-sm text-[#6b7280]">
              <li><Link href="/login" className="hover:text-[#2563EB]">Entrar</Link></li>
              <li><Link href="/register" className="hover:text-[#2563EB]">Criar conta</Link></li>
              <li><Link href="/bookings" className="hover:text-[#2563EB]">Minhas reservas</Link></li>
              <li><Link href="/profile" className="hover:text-[#2563EB]">Perfil</Link></li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Suporte</h3>
            <ul className="space-y-2 text-sm text-[#6b7280]">
              <li><span>Central de ajuda</span></li>
              <li><span>Política de reembolso</span></li>
              <li><span>Termos de uso</span></li>
              <li><span>Privacidade</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#e5e7eb] flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#6b7280]">
            © {new Date().getFullYear()} Ticketify. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[#6b7280]">
            Compra 100% segura e garantida.
          </p>
        </div>
      </div>
    </footer>
  )
}
