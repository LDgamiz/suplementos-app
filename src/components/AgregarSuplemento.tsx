import { useState, useEffect, useRef } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { SuplementoCat } from '../hooks/useSuplementos'
import HintButton from './HintButton'
import { LIMITS, ValidationError, requireString, boundedNumber } from '../lib/validation'

interface Props {
  onAgregar: (suplemento_id: string, dosis: string) => void
  userId: string
}

interface NuevoCat {
  name: string
  category: string
  recommended_dose: string
  dose_unit: string
}

export default function AgregarSuplemento({ onAgregar, userId }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<SuplementoCat[]>([])
  const [seleccionado, setSeleccionado] = useState<SuplementoCat | null>(null)
  const [dosis, setDosis] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [creandoNuevo, setCreandoNuevo] = useState(false)
  const [nuevoCat, setNuevoCat] = useState<NuevoCat>({ name: '', category: '', recommended_dose: '', dose_unit: '' })
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
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
    let cleanName: string, cleanCategory: string, cleanUnit: string, cleanDose: number
    try {
      cleanName = requireString(nuevoCat.name, LIMITS.supplementName.min, LIMITS.supplementName.max, 'Name')
      cleanCategory = requireString(nuevoCat.category, LIMITS.supplementCategory.min, LIMITS.supplementCategory.max, 'Category')
      cleanUnit = requireString(nuevoCat.dose_unit, LIMITS.doseUnit.min, LIMITS.doseUnit.max, 'Unit')
      cleanDose = boundedNumber(nuevoCat.recommended_dose, LIMITS.doseAmount.min, LIMITS.doseAmount.max, 'Dose amount')
    } catch (e) {
      setSubmitMsg(e instanceof ValidationError ? e.message : 'Invalid input')
      setTimeout(() => setSubmitMsg(null), 5000)
      return
    }
    const { data, error } = await supabase
      .from('suplementos_cat')
      .insert([{
        name: cleanName,
        category: cleanCategory,
        recommended_dose: cleanDose,
        dose_unit: cleanUnit,
        status: 'pending',
        created_by: userId,
      }])
      .select()
      .single()
    if (!error && data) {
      seleccionar(data as SuplementoCat)
      setSubmitMsg('Submitted for review — you can use it today, an admin will approve it.')
      setTimeout(() => setSubmitMsg(null), 5000)
    }
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Plus size={16} className="text-brand" />
          Add supplement
        </h2>
        <HintButton
          label="Add supplement hint"
          text="Search the catalog. If it's missing, suggest it — admins approve new entries. You can use a pending suggestion right away."
        />
      </div>

      <div ref={containerRef} className="relative mb-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            placeholder="Search supplement (e.g. Vitamin D)"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setSeleccionado(null); setCreandoNuevo(false) }}
            onFocus={() => busqueda.length >= 2 && !seleccionado && setAbierto(true)}
            maxLength={LIMITS.supplementName.max}
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
                    <span className="flex items-center gap-2">
                      {cat.status === 'pending' && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                          pending
                        </span>
                      )}
                      <span className="text-xs text-slate-500 capitalize">{cat.category}</span>
                    </span>
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
            maxLength={LIMITS.supplementName.max}
            className={`${miniInput} mb-2`}
          />
          <input
            placeholder="Category (e.g. vitamin, mineral, protein)"
            value={nuevoCat.category}
            onChange={e => setNuevoCat(prev => ({ ...prev, category: e.target.value }))}
            maxLength={LIMITS.supplementCategory.max}
            className={`${miniInput} mb-2`}
          />
          <div className="flex gap-2 mb-3">
            <input
              placeholder="Dose amount"
              type="number"
              min={LIMITS.doseAmount.min}
              max={LIMITS.doseAmount.max}
              step="any"
              value={nuevoCat.recommended_dose}
              onChange={e => setNuevoCat(prev => ({ ...prev, recommended_dose: e.target.value }))}
              className={miniInput}
            />
            <input
              placeholder="Unit (mg, mcg, g...)"
              value={nuevoCat.dose_unit}
              onChange={e => setNuevoCat(prev => ({ ...prev, dose_unit: e.target.value }))}
              maxLength={LIMITS.doseUnit.max}
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
        maxLength={LIMITS.dosis.max}
        className={`${inputClass} mb-4`}
      />
      {submitMsg && (
        <p className="text-xs text-amber-400 mb-3 px-3 py-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
          {submitMsg}
        </p>
      )}
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
