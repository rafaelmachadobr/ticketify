"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Clock } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { formatCurrency } from "@/lib/utils"

const CHECKOUT_TTL = 7 * 60

type PaymentMethod = "credit" | "pix"

interface CardBrand {
  id: string
  label: string
  pattern: RegExp
  bg: string
  text: string
  maxLen: number // digits only
  gaps: number[] // positions to insert space (after these digit indices)
}

const BRANDS: CardBrand[] = [
  {
    id: "amex",
    label: "Amex",
    pattern: /^3[47]/,
    bg: "#007BC1",
    text: "#fff",
    maxLen: 15,
    gaps: [4, 10],
  },
  {
    id: "elo",
    label: "Elo",
    pattern:
      /^4011|^4312|^4389|^4514|^4576|^5041|^5066|^5067|^509|^6277|^6362|^6363|^650|^6516|^6550/,
    bg: "#00A4E0",
    text: "#fff",
    maxLen: 16,
    gaps: [4, 8, 12],
  },
  {
    id: "hipercard",
    label: "Hiper",
    pattern: /^606282|^3841/,
    bg: "#B3131B",
    text: "#fff",
    maxLen: 16,
    gaps: [4, 8, 12],
  },
  {
    id: "mastercard",
    label: "Master",
    pattern: /^5[1-5]|^2[2-7]/,
    bg: "#EB001B",
    text: "#fff",
    maxLen: 16,
    gaps: [4, 8, 12],
  },
  {
    id: "visa",
    label: "Visa",
    pattern: /^4/,
    bg: "#1A1F71",
    text: "#fff",
    maxLen: 16,
    gaps: [4, 8, 12],
  },
]

function detectBrand(digits: string): CardBrand | null {
  return BRANDS.find((b) => b.pattern.test(digits)) ?? null
}

function applyCardMask(raw: string, brand: CardBrand | null): string {
  const digits = raw.replace(/\D/g, "")
  const max = brand?.maxLen ?? 16
  const gaps = brand?.gaps ?? [4, 8, 12]
  const trimmed = digits.slice(0, max)
  let result = ""
  for (let i = 0; i < trimmed.length; i++) {
    if (gaps.includes(i) && i !== 0) result += " "
    result += trimmed[i]
  }
  return result
}

function applyExpiryMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function applyCpfMask(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function BrandBadge({ brand }: { brand: CardBrand }) {
  return (
    <span
      className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide select-none"
      style={{ background: brand.bg, color: brand.text, minWidth: 42 }}
    >
      {brand.label}
    </span>
  )
}

const INPUT_CLS =
  "w-full border border-[#e5e7eb] rounded-[8px] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"

export default function CheckoutPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [secondsLeft, setSecondsLeft] = useState(CHECKOUT_TTL)
  const [expired, setExpired] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit")
  const [confirming, setConfirming] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Credit card fields
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")

  // CPF mask
  const [cpf, setCpf] = useState("")

  const brand = detectBrand(cardNumber.replace(/\s/g, ""))

  const eventId = searchParams.get("event_id") ?? ""
  const seatLabel = searchParams.get("seat") ?? "—"
  const seatSection = searchParams.get("section") ?? "—"
  const price = parseFloat(searchParams.get("price") ?? "0") || 0

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")
  const isUrgent = secondsLeft <= 60

  const convenience = Math.round(price * 0.1 * 100) / 100
  const total = price + convenience

  const pixKey = `ticketify-pix-${token?.slice(0, 20)}`

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (expired) return
    setConfirming(true)
    try {
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_token: token }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? "Erro ao confirmar. Tente novamente.")
        return
      }
      const { booking_id } = await res.json()
      router.push(`/bookings/${booking_id}/confirmation`)
    } catch {
      alert("Erro ao confirmar compra. Tente novamente.")
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Minimal header with timer */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
          <Link
            href={eventId ? `/events/${eventId}/seats` : "/events"}
            className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827] transition-colors w-24"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex-1 flex justify-center">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
                isUrgent
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-blue-50 text-[#2563EB] border border-blue-100"
              }`}
            >
              <Clock className="w-4 h-4" />
              {mm}:{ss}
            </div>
          </div>
          <div className="w-24" />
        </div>
      </header>

      {/* Expiration modal */}
      {expired && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[8px] p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#111827] mb-2">Reserva expirada</h2>
            <p className="text-sm text-[#6b7280] mb-5">
              O tempo para concluir sua compra esgotou. O assento foi liberado para outros usuários.
            </p>
            <button
              onClick={() => router.push(eventId ? `/events/${eventId}/seats` : "/events")}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3 rounded-[8px] transition-colors"
            >
              Escolher assento novamente
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Form */}
        <form onSubmit={handleConfirm} className="flex-1 min-w-0 space-y-5">
          {/* Personal data */}
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-5">
            <h2 className="font-bold text-[#111827] mb-4">Dados pessoais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Nome completo
                </label>
                <input
                  required
                  placeholder="João da Silva"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">CPF</label>
                <input
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(applyCpfMask(e.target.value))}
                  inputMode="numeric"
                  className={INPUT_CLS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#374151] mb-1">E-mail</label>
                <input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-5">
            <h2 className="font-bold text-[#111827] mb-4">Pagamento</h2>

            <div className="flex gap-2 mb-4">
              {(["credit", "pix"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 rounded-[8px] text-sm font-semibold border transition-colors ${
                    paymentMethod === m
                      ? "bg-[#2563EB] border-[#2563EB] text-white"
                      : "bg-white border-[#e5e7eb] text-[#374151] hover:border-[#2563EB]"
                  }`}
                >
                  {m === "credit" ? "Cartão de crédito" : "Pix"}
                </button>
              ))}
            </div>

            {paymentMethod === "credit" ? (
              <div className="space-y-4">
                {/* Card number + brand */}
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Número do cartão
                  </label>
                  <div className="relative">
                    <input
                      required
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(applyCardMask(e.target.value, brand))
                      }
                      inputMode="numeric"
                      className={`${INPUT_CLS} pr-16`}
                    />
                    {brand && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <BrandBadge brand={brand} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">
                      Validade
                    </label>
                    <input
                      required
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => setExpiry(applyExpiryMask(e.target.value))}
                      inputMode="numeric"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">CVV</label>
                    <input
                      required
                      placeholder={brand?.id === "amex" ? "0000" : "000"}
                      value={cvv}
                      onChange={(e) =>
                        setCvv(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, brand?.id === "amex" ? 4 : 3)
                        )
                      }
                      inputMode="numeric"
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Nome no cartão
                  </label>
                  <input
                    required
                    placeholder="JOAO DA SILVA"
                    onChange={(e) =>
                      (e.target.value = e.target.value.toUpperCase())
                    }
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 gap-4">
                <div className="p-3 border border-[#e5e7eb] rounded-[8px] bg-white">
                  <QRCodeSVG value={pixKey} size={160} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#111827]">
                    Pague {formatCurrency(total)} via Pix
                  </p>
                  <p className="text-xs text-[#6b7280] mt-1">
                    Escaneie o QR code ou copie a chave abaixo
                  </p>
                </div>
                <div className="w-full bg-[#f3f4f6] rounded-[8px] p-3 flex items-center justify-between gap-2">
                  <code className="text-xs text-[#374151] truncate">{pixKey}</code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(pixKey)}
                    className="text-xs text-[#2563EB] font-semibold shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={confirming || expired}
            className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-[8px] transition-colors"
          >
            {confirming ? "Processando..." : "Finalizar Compra"}
          </button>
        </form>

        {/* Sticky order summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-5 lg:sticky lg:top-20">
            <h3 className="font-bold text-[#111827] mb-4">Resumo do Pedido</h3>
            <div className="space-y-3 text-sm">
              {seatSection && (
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">{seatSection}</span>
                  <span className="font-medium text-[#111827]">Assento {seatLabel}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Subtotal</span>
                <span className="text-[#111827]">{formatCurrency(price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Taxa de conveniência</span>
                <span className="text-[#111827]">{formatCurrency(convenience)}</span>
              </div>
            </div>
            <div className="border-t border-[#e5e7eb] mt-4 pt-4">
              <div className="flex justify-between">
                <span className="font-bold text-[#111827]">Total</span>
                <span className="font-bold text-[#2563EB] text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-[#9ca3af]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Compra 100% segura
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
