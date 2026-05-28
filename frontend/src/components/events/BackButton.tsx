"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={className}
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar
    </button>
  )
}
