import { useState, useEffect, useRef } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { SuplementoCat } from '../hooks/useSuplementos'

interface Props {
  onAgregar: (suplemento_id: string, dosis: string) => void
}

interface NuevoCat {
  name: string
  category: string
  recommended_dose: string
  dose_unit: string
}

export default function AgregarSuplemento({ onAgregar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<SuplementoCat[]>([])
  const [seleccionado, setSeleccionado] = useState<SuplementoCat | null>(null)
  const [dosis, setDosis] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [creandoNuevo, setCreandoNuevo] = useState(false)
  const [nuevoCat, setNuevoCat] = useState<NuevoCat>({ name: '', category: '', recommended_dose: '', dose_unit: '' })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (seleccionado) return
    if (busqueda.length < 2) { setResultados([]); setAbierto(false); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('suplementos_cat')
        .select('*')
        .ilike('name', `%${busqueda}%`)
        .limit(8)
      setResultados(data || [])
      setAbierto(true)
    }, 300)
    return () => clearTimeout(t)
  }, [busqueda, seleccionado])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const seleccionar = (cat: SuplementoCat) => {
    setSeleccionado(cat)
    setBusqueda(cat.name)
    setDosis(`${cat.recommended_dose} ${cat.dose_unit}`)
    setResultados([])
    setAbierto(false)
    setCreandoNuevo(false)
  }

  const iniciarCreacion = () => {
    setAbierto(false)
    setCreandoNuevo(true)
    setNuevoCat({ name: busqueda, category: '', recommended_dose: '', dose_unit: '' })
  }

  const crearEnCatalogo = async () => {
    if (!nuevoCat.name || !nuevoCat.category || !nuevoCat.recommended_dose || !nuevoCat.dose_unit) return
    const { data, error } = await supabase
      .from('suplementos_cat')
      .insert([{
        name: nuevoCat.name,
        category: nuevoCat.category,
        recommended_dose: parseFloat(nuevoCat.recommended_dose),
        dose_unit: nuevoCat.dose_unit
      }])
      .select()
      .single()
    if (!error && data) seleccionar(data as SuplementoCat)
  }

  const handleAgregar = () => {
    if (!seleccionado || !dosis) return
    onAgregar(seleccionado.id, dosis)
    setBusqueda('')
    setSeleccionado(null)
    setDosis('')
    setCreandoNuevo(false)
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'

  const miniInput =
    'w-full px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-sm'

  return (
    <div className="mt-8 bg-surface border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Plus size={16} className="text-brand" />
        Add supplement
      </h2>

      <div ref={containerRef} className="relative mb-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            placeholder="Search supplement (e.g. Vitamin D)"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setSeleccionado(null); setCreandoNuevo(false) }}
            onFocus={() => busqueda.length >= 2 && !seleccionado && setAbierto(true)}
            className={`${inputClass} pl-9`}
          />
        </div>
        {abierto && !seleccionado && (
          <div className="absolute z-10 w-full mt-1 bg-surface-2 border border-white/10 rounded-xl overflow-hidden shadow-xl">
            {resultados.length > 0 ? (
              <ul>
                {resultados.map(cat => (
                  <li
                    key={cat.id}
                    onMouseDown={() => seleccionar(cat)}
                    className="px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-white/[0.05] transition">
                    <span className="text-slate-200 text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{cat.category}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                onMouseDown={iniciarCreacion}
                className="px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-white/[0.05] transition">
                <Plus size={14} className="text-brand shrink-0" />
                <span className="text-sm text-slate-300">
                  Add <span className="text-brand font-medium">"{busqueda}"</span> to catalog
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {creandoNuevo && (
        <div className="mb-3 p-4 bg-surface-2 border border-brand/20 rounded-xl">
          <p className="text-xs text-brand font-semibold uppercase tracking-wider mb-3">New catalog entry</p>
          <input
            placeholder="Name"
            value={nuevoCat.name}
            onChange={e => setNuevoCat(prev => ({ ...prev, name: e.target.value }))}
            className={`${miniInput} mb-2`}
          />
          <input
            placeholder="Category (e.g. vitamin, mineral, protein)"
            value={nuevoCat.category}
            onChange={e => setNuevoCat(prev => ({ ...prev, category: e.target.value }))}
            className={`${miniInput} mb-2`}
          />
          <div className="flex gap-2 mb-3">
            <input
              placeholder="Dose amount"
              type="number"
              value={nuevoCat.recommended_dose}
              onChange={e => setNuevoCat(prev => ({ ...prev, recommended_dose: e.target.value }))}
              className={miniInput}
            />
            <input
              placeholder="Unit (mg, mcg, g...)"
              value={nuevoCat.dose_unit}
              onChange={e => setNuevoCat(prev => ({ ...prev, dose_unit: e.target.value }))}
              className={miniInput}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCreandoNuevo(false)}
              className="flex-1 py-2 text-xs rounded-xl bg-surface border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition">
              Cancel
            </button>
            <button
              onClick={crearEnCatalogo}
              className="flex-1 py-2 text-xs rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition">
              Add to catalog
            </button>
          </div>
        </div>
      )}

      <input
        placeholder="Dose (e.g. 16 mg)"
        value={dosis}
        onChange={e => setDosis(e.target.value)}
        className={`${inputClass} mb-4`}
      />
      <button
        onClick={handleAgregar}
        disabled={!seleccionado || !dosis}
        className="w-full py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0E1A] font-bold rounded-xl transition flex items-center justify-center gap-2">
        <Plus size={16} />
        Add
      </button>
    </div>
  )
}
