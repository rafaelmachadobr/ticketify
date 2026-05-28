"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
}

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={`w-full h-10 px-3 pr-10 rounded-[8px] border border-[#e5e7eb] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent placeholder:text-[#9ca3af] ${className ?? ""}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] transition-colors"
        tabIndex={-1}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
