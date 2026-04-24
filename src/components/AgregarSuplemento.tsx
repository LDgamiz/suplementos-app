import { useState } from 'react'
import { Plus } from 'lucide-react'

interface Props {
  onAgregar: (nombre: string, dosis: string) => void
}

export default function AgregarSuplemento({ onAgregar }: Props) {
  const [nombre, setNombre] = useState('')
  const [dosis, setDosis] = useState('')

  const handleAgregar = () => {
    onAgregar(nombre, dosis)
    setNombre('')
    setDosis('')
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'

  return (
    <div className="mt-8 bg-surface border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Plus size={16} className="text-brand" />
        Agregar suplemento
      </h2>
      <input
        placeholder="Nombre (ej. Vitamina D)"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        className={`${inputClass} mb-3`}
      />
      <input
        placeholder="Dosis (ej. 1 cápsula)"
        value={dosis}
        onChange={e => setDosis(e.target.value)}
        className={`${inputClass} mb-4`}
      />
      <button
        onClick={handleAgregar}
        className="w-full py-2.5 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition flex items-center justify-center gap-2">
        <Plus size={16} />
        Agregar
      </button>
    </div>
  )
}
