import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Zap, Play, Trash2, Plus, Search } from 'lucide-react'
import { SuplementoCat } from './hooks/useSuplementos'

interface SupplementoRutina {
  suplemento_id: string
  nombre: string
  dosis: string
}

interface NuevoCat {
  name: string
  category: string
  recommended_dose: string
  dose_unit: string
}

interface FilaUI extends SupplementoRutina {
  busqueda: string
  resultados: SuplementoCat[]
  abierto: boolean
  creandoNuevo: boolean
  nuevoCat: NuevoCat
}

interface Rutina {
  id: number
  nombre: string
  user_id: string
  rutina_suplementos: SupplementoRutina[]
}

interface Props {
  session: Session
  onAplicarRutina: (suplementos: { suplemento_id: string; dosis: string }[]) => void
}

const filaVacia = (): FilaUI => ({
  suplemento_id: '', nombre: '', dosis: '', busqueda: '', resultados: [], abierto: false,
  creandoNuevo: false, nuevoCat: { name: '', category: '', recommended_dose: '', dose_unit: '' }
})

export default function Rutinas({ session, onAplicarRutina }: Props) {
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [nombreRutina, setNombreRutina] = useState<string>('')
  const [filas, setFilas] = useState<FilaUI[]>([filaVacia()])
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  useEffect(() => { cargarRutinas() }, [])

  const cargarRutinas = async () => {
    const { data: rutinasData, error } = await supabase
      .from('rutinas')
      .select('*')
      .eq('user_id', session.user.id)
    if (error) return

    const rutinasConSuplemento = await Promise.all(
      rutinasData.map(async (rutina) => {
        const { data: suplementos } = await supabase
          .from('rutina_suplementos')
          .select('*')
          .eq('rutina_id', rutina.id)
        return { ...rutina, rutina_suplementos: suplementos || [] }
      })
    )
    setRutinas(rutinasConSuplemento)
  }

  const actualizarBusqueda = (index: number, valor: string) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], busqueda: valor, suplemento_id: '', nombre: '', resultados: [], abierto: false }
      return nuevas
    })
    clearTimeout(timers.current[index])
    if (valor.length < 2) return
    timers.current[index] = setTimeout(async () => {
      const { data } = await supabase
        .from('suplementos_cat')
        .select('*')
        .ilike('name', `%${valor}%`)
        .limit(8)
      setFilas(prev => {
        const nuevas = [...prev]
        if (nuevas[index]?.busqueda !== valor) return prev
        nuevas[index] = { ...nuevas[index], resultados: data || [], abierto: true }
        return nuevas
      })
    }, 300)
  }

  const seleccionarCat = (index: number, cat: SuplementoCat) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = {
        ...nuevas[index],
        suplemento_id: cat.id,
        nombre: cat.name,
        dosis: `${cat.recommended_dose} ${cat.dose_unit}`,
        busqueda: cat.name,
        resultados: [],
        abierto: false,
        creandoNuevo: false,
      }
      return nuevas
    })
  }

  const iniciarCreacionEnFila = (index: number) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = {
        ...nuevas[index],
        abierto: false,
        creandoNuevo: true,
        nuevoCat: { name: nuevas[index].busqueda, category: '', recommended_dose: '', dose_unit: '' }
      }
      return nuevas
    })
  }

  const actualizarNuevoCat = (index: number, campo: keyof NuevoCat, valor: string) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], nuevoCat: { ...nuevas[index].nuevoCat, [campo]: valor } }
      return nuevas
    })
  }

  const crearEnCatalogoParaFila = async (index: number) => {
    const cat = filas[index].nuevoCat
    if (!cat.name || !cat.category || !cat.recommended_dose || !cat.dose_unit) return
    const { data, error } = await supabase
      .from('suplementos_cat')
      .insert([{
        name: cat.name,
        category: cat.category,
        recommended_dose: parseFloat(cat.recommended_dose),
        dose_unit: cat.dose_unit
      }])
      .select()
      .single()
    if (!error && data) seleccionarCat(index, data as SuplementoCat)
  }

  const actualizarDosis = (index: number, valor: string) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], dosis: valor }
      return nuevas
    })
  }

  const cerrarDropdown = (index: number) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], abierto: false }
      return nuevas
    })
  }

  const guardarRutina = async () => {
    if (!nombreRutina) return
    const { data, error } = await supabase
      .from('rutinas')
      .insert([{ nombre: nombreRutina, user_id: session.user.id }])
      .select()
    if (error) return

    const rutinaId = data[0].id
    const insertar = filas
      .filter(f => f.suplemento_id && f.dosis)
      .map(f => ({ rutina_id: rutinaId, suplemento_id: f.suplemento_id, nombre: f.nombre, dosis: f.dosis }))

    await supabase.from('rutina_suplementos').insert(insertar)
    setNombreRutina('')
    setFilas([filaVacia()])
    cargarRutinas()
  }

  const eliminarRutina = async (id: number) => {
    await supabase.from('rutina_suplementos').delete().eq('rutina_id', id)
    await supabase.from('rutinas').delete().eq('id', id)
    setRutinas(rutinas.filter(r => r.id !== id))
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-sm'

  const dosisClass =
    'w-28 shrink-0 px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-sm'

  const miniInput =
    'w-full px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-sm'

  return (
    <div className="mt-8 bg-surface border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Zap size={16} className="text-brand" />
        Routines
      </h2>

      {rutinas.length > 0 && (
        <div className="mb-6 space-y-2">
          {rutinas.map(rutina => (
            <div key={rutina.id} className="flex justify-between items-center p-3 bg-surface-2 border border-white/10 rounded-xl">
              <div>
                <p className="font-semibold text-slate-200">{rutina.nombre}</p>
                <p className="text-xs text-slate-500">{rutina.rutina_suplementos.length} supplements</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAplicarRutina(rutina.rutina_suplementos.map(s => ({ suplemento_id: s.suplemento_id, dosis: s.dosis })))}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition">
                  <Play size={13} />
                  Apply
                </button>
                <button
                  onClick={() => eliminarRutina(rutina.id)}
                  className="p-2 rounded-lg bg-surface border border-white/10 text-rose-400/50 hover:border-rose-400/30 hover:text-rose-400 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">New routine</h3>
      <input
        placeholder="Routine name (e.g. Morning stack)"
        value={nombreRutina}
        onChange={e => setNombreRutina(e.target.value)}
        className={`${inputClass} mb-4`}
      />

      {filas.map((fila, index) => (
        <div key={index}>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                placeholder="Search supplement"
                value={fila.busqueda}
                onChange={e => actualizarBusqueda(index, e.target.value)}
                onBlur={() => setTimeout(() => cerrarDropdown(index), 150)}
                className={`${inputClass} pl-8`}
              />
              {fila.abierto && (
                <div className="absolute z-10 w-full mt-1 bg-surface-2 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {fila.resultados.length > 0 ? (
                    <ul>
                      {fila.resultados.map(cat => (
                        <li
                          key={cat.id}
                          onMouseDown={() => seleccionarCat(index, cat)}
                          className="px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-white/[0.05] transition text-sm">
                          <span className="text-slate-200">{cat.name}</span>
                          <span className="text-xs text-slate-500 capitalize">{cat.category}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div
                      onMouseDown={() => iniciarCreacionEnFila(index)}
                      className="px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-white/[0.05] transition">
                      <Plus size={13} className="text-brand shrink-0" />
                      <span className="text-sm text-slate-300">
                        Add <span className="text-brand font-medium">"{fila.busqueda}"</span> to catalog
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              placeholder="Dose"
              value={fila.dosis}
              onChange={e => actualizarDosis(index, e.target.value)}
              className={dosisClass}
            />
          </div>

          {fila.creandoNuevo && (
            <div className="mb-3 p-4 bg-surface-2 border border-brand/20 rounded-xl">
              <p className="text-xs text-brand font-semibold uppercase tracking-wider mb-3">New catalog entry</p>
              <input
                placeholder="Name"
                value={fila.nuevoCat.name}
                onChange={e => actualizarNuevoCat(index, 'name', e.target.value)}
                className={`${miniInput} mb-2`}
              />
              <input
                placeholder="Category (e.g. vitamin, mineral, protein)"
                value={fila.nuevoCat.category}
                onChange={e => actualizarNuevoCat(index, 'category', e.target.value)}
                className={`${miniInput} mb-2`}
              />
              <div className="flex gap-2 mb-3">
                <input
                  placeholder="Dose amount"
                  type="number"
                  value={fila.nuevoCat.recommended_dose}
                  onChange={e => actualizarNuevoCat(index, 'recommended_dose', e.target.value)}
                  className={miniInput}
                />
                <input
                  placeholder="Unit (mg, mcg, g...)"
                  value={fila.nuevoCat.dose_unit}
                  onChange={e => actualizarNuevoCat(index, 'dose_unit', e.target.value)}
                  className={miniInput}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilas(prev => { const n = [...prev]; n[index] = { ...n[index], creandoNuevo: false }; return n })}
                  className="flex-1 py-2 text-xs rounded-xl bg-surface border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition">
                  Cancel
                </button>
                <button
                  onClick={() => crearEnCatalogoParaFila(index)}
                  className="flex-1 py-2 text-xs rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition">
                  Add to catalog
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => setFilas(prev => [...prev, filaVacia()])}
        className="flex items-center gap-1.5 text-sm text-brand/70 hover:text-brand transition mb-4 mt-1">
        <Plus size={14} />
        Add supplement to routine
      </button>
      <button
        onClick={guardarRutina}
        className="w-full py-2.5 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition">
        Save routine
      </button>
    </div>
  )
}
