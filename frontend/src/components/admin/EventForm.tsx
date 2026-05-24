"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Upload, X, ImageIcon } from "lucide-react"

interface SeatSectionInput {
  name: string
  capacity: string
  price: string
}

interface EventFormProps {
  initialData?: {
    title?: string
    venue?: string
    city?: string
    category?: string
    date_from?: string
    date_to?: string
    gates_open?: string
    description?: string
    published?: boolean
    image_url?: string
    seat_sections?: SeatSectionInput[]
  }
  eventId?: string
}

const CATEGORIES = ["Shows", "Teatro", "Esportes", "Stand-up", "Festivais", "Outros"]

export function EventForm({ initialData, eventId }: EventFormProps) {
  const router = useRouter()
  const isEdit = Boolean(eventId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialData?.title ?? "")
  const [venue, setVenue] = useState(initialData?.venue ?? "")
  const [city, setCity] = useState(initialData?.city ?? "")
  const [category, setCategory] = useState(initialData?.category ?? "Shows")
  const [dateFrom, setDateFrom] = useState(initialData?.date_from?.slice(0, 16) ?? "")
  const [dateTo, setDateTo] = useState(initialData?.date_to?.slice(0, 16) ?? "")
  const [gatesOpen, setGatesOpen] = useState(initialData?.gates_open?.slice(0, 16) ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [published, setPublished] = useState(initialData?.published ?? false)
  const [sections, setSections] = useState<SeatSectionInput[]>(
    initialData?.seat_sections ?? [{ name: "", capacity: "", price: "" }]
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_url ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const addSection = () => setSections((s) => [...s, { name: "", capacity: "", price: "" }])
  const removeSection = (i: number) => setSections((s) => s.filter((_, idx) => idx !== i))
  const updateSection = (i: number, field: keyof SeatSectionInput, value: string) => {
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, [field]: value } : sec)))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body = {
      title,
      venue,
      city,
      category,
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      gates_open: gatesOpen ? new Date(gatesOpen).toISOString() : undefined,
      description,
      published,
      ...(isEdit
        ? {}
        : {
            seat_sections: sections.map((s) => ({
              name: s.name,
              capacity: parseInt(s.capacity, 10),
              price: parseFloat(s.price),
            })),
          }),
    }

    try {
      const url = isEdit ? `/api/admin/events/${eventId}` : "/api/admin/events"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message ?? "Erro ao salvar evento.")
        return
      }

      const savedEvent = await res.json()
      const savedId = savedEvent.id ?? eventId

      // Upload imagem se selecionada
      if (imageFile && savedId) {
        const formData = new FormData()
        formData.append("image", imageFile)
        const imgRes = await fetch(`/api/admin/events/${savedId}/image`, {
          method: "POST",
          body: formData,
        })
        if (!imgRes.ok) {
          setError("Evento salvo, mas erro ao fazer upload da imagem.")
          setLoading(false)
          return
        }
      }

      router.push("/admin/events")
      router.refresh()
    } catch {
      setError("Erro ao salvar evento.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-[8px]">
          {error}
        </div>
      )}

      <Card title="Imagem do evento">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          id="image-upload"
        />
        {imagePreview ? (
          <div className="relative">
            <div
              className="w-full h-48 rounded-[8px] bg-cover bg-center border border-[#e5e7eb]"
              style={{ backgroundImage: `url(${imagePreview})` }}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-white border border-[#e5e7eb] hover:bg-red-50 hover:border-red-200 text-[#374151] hover:text-red-600 rounded-full p-1.5 transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-white border border-[#e5e7eb] hover:bg-[#f9fafb] text-[#374151] text-xs font-medium px-3 py-1.5 rounded-[6px] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Trocar imagem
            </button>
          </div>
        ) : (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#e5e7eb] rounded-[8px] cursor-pointer hover:border-[#2563EB] hover:bg-[#eff6ff]/30 transition-colors group"
          >
            <ImageIcon className="w-10 h-10 text-[#d1d5db] group-hover:text-[#93c5fd] mb-3 transition-colors" />
            <p className="text-sm font-medium text-[#6b7280] group-hover:text-[#2563EB] transition-colors">
              Clique para fazer upload
            </p>
            <p className="text-xs text-[#9ca3af] mt-1">PNG, JPG ou WEBP — máx. 5MB</p>
          </label>
        )}
      </Card>

      <Card title="Informações básicas">
        <Field label="Título *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Nome do evento"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Local *">
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              placeholder="Nome do local"
              className={inputClass}
            />
          </Field>
          <Field label="Cidade *">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="São Paulo"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Categoria *">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Descrição do evento..."
            className={inputClass}
          />
        </Field>
      </Card>

      <Card title="Datas e horários">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Início *">
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Término">
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Abertura de portões">
          <input
            type="datetime-local"
            value={gatesOpen}
            onChange={(e) => setGatesOpen(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Card>

      {!isEdit && (
        <Card title="Setores de assentos">
          <div className="space-y-3">
            {sections.map((section, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input
                    placeholder="Nome do setor"
                    value={section.name}
                    onChange={(e) => updateSection(i, "name", e.target.value)}
                    required
                    className={inputClass}
                  />
                  <input
                    placeholder="Capacidade"
                    type="number"
                    min="1"
                    value={section.capacity}
                    onChange={(e) => updateSection(i, "capacity", e.target.value)}
                    required
                    className={inputClass}
                  />
                  <input
                    placeholder="Preço (R$)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={section.price}
                    onChange={(e) => updateSection(i, "price", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    className="text-red-400 hover:text-red-600 mt-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSection}
              className="flex items-center gap-1.5 text-sm text-[#2563EB] hover:text-blue-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar setor
            </button>
          </div>
        </Card>
      )}

      <Card title="Publicação">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 rounded accent-[#2563EB]"
          />
          <span className="text-sm text-[#374151]">Publicar evento (visível ao público)</span>
        </label>
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-[8px] transition-colors"
        >
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar evento"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] text-[#374151] font-medium px-5 py-2.5 rounded-[8px] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-5">
      <h3 className="text-sm font-semibold text-[#374151] mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6b7280] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  "w-full text-sm border border-[#e5e7eb] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] bg-white"
