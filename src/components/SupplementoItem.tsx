import { useState } from 'react'
import { Suplemento } from '../hooks/useSuplementos'
import { Globe, Pencil, Check, Circle, Trash2 } from 'lucide-react'

interface Props {
  suple: Suplemento
  onMarcar: (id: number) => void
  onEliminar: (id: number) => void
  onTogglePublico: (id: number, publico: boolean) => void
  onEditar: (id: number, dosis: string) => void
}

export default function SupplementoItem({ suple, onMarcar, onEliminar, onTogglePublico, onEditar }: Props) {
  const [editando, setEditando] = useState(false)
  const [dosis, setDosis] = useState(suple.dosis)

  const nombre = suple.suplementos_cat?.name ?? '—'

  function guardar() {
    if (!dosis.trim()) return
    onEditar(suple.id, dosis.trim())
    setEditando(false)
  }

  function cancelar() {
    setDosis(suple.dosis)
    setEditando(false)
  }

  const inputClass =
    'flex-1 px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 text-sm transition'

  const iconBtn = 'p-2 rounded-lg border transition flex items-center justify-center'

  if (editando) return (
    <li className="p-4 mb-3 rounded-xl border border-brand/20 bg-brand/[0.04]">
      <p className="text-slate-400 text-sm mb-2 font-medium">{nombre}</p>
      <div className="flex gap-2 mb-3">
        <input value={dosis} onChange={e => setDosis(e.target.value)} className={inputClass} placeholder="Dose" />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={cancelar}
          className="text-xs px-3 py-1.5 rounded-lg bg-surface-2 border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition">
          Cancel
        </button>
        <button
          onClick={guardar}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition">
          Save
        </button>
      </div>
    </li>
  )

  return (
    <li className={`flex justify-between items-center p-4 mb-3 rounded-xl border transition-all ${
      suple.tomado ? 'bg-brand/[0.06] border-brand/25' : 'bg-surface border-white/[0.08]'
    }`}>
      <span className={suple.tomado ? 'line-through text-slate-600' : 'text-slate-200'}>
        <span className="font-semibold">{nombre}</span>
        <span className={`text-sm ml-2 ${suple.tomado ? 'text-slate-700' : 'text-slate-400'}`}>
          — {suple.dosis}
        </span>
      </span>

      <div className="flex gap-1.5">
        <button
          onClick={() => onTogglePublico(suple.id, suple.publico)}
          title={suple.publico ? 'Remove from public profile' : 'Show in public profile'}
          className={`${iconBtn} ${suple.publico ? 'bg-brand/10 border-brand/30 text-brand' : 'bg-surface-2 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'}`}>
          <Globe size={14} />
        </button>
        <button
          onClick={() => setEditando(true)}
          className={`${iconBtn} bg-surface-2 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200`}>
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onMarcar(suple.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
            suple.tomado
              ? 'bg-brand/10 border-brand/30 text-brand'
              : 'bg-surface-2 border-white/10 text-slate-300 hover:border-brand/30 hover:text-brand'
          }`}>
          {suple.tomado ? <Check size={13} /> : <Circle size={13} />}
          {suple.tomado ? 'Taken' : 'Mark'}
        </button>
        <button
          onClick={() => onEliminar(suple.id)}
          className={`${iconBtn} bg-surface-2 border-white/10 text-rose-400/50 hover:border-rose-400/30 hover:text-rose-400`}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  )
}
