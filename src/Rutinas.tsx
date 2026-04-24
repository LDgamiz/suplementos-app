import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Zap, Play, Trash2, Plus } from 'lucide-react'

interface SupplementoRutina {
  nombre: string
  dosis: string
}

interface Rutina {
  id: number
  nombre: string
  user_id: string
  rutina_suplementos: SupplementoRutina[]
}

interface Props {
  session: Session
  onAplicarRutina: (suplementos: SupplementoRutina[]) => void
}

export default function Rutinas({ session, onAplicarRutina }: Props) {
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [nombreRutina, setNombreRutina] = useState<string>('')
  const [suplementosRutina, setSuplementosRutina] = useState<SupplementoRutina[]>([
    { nombre: '', dosis: '' }
  ])

  useEffect(() => {
    cargarRutinas()
  }, [])

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

  const agregarFilaSuplemento = () => {
    setSuplementosRutina([...suplementosRutina, { nombre: '', dosis: '' }])
  }

  const actualizarFila = (index: number, campo: keyof SupplementoRutina, valor: string) => {
    const nuevas = [...suplementosRutina]
    nuevas[index][campo] = valor
    setSuplementosRutina(nuevas)
  }

  const guardarRutina = async () => {
    if (!nombreRutina) return
    const { data, error } = await supabase
      .from('rutinas')
      .insert([{ nombre: nombreRutina, user_id: session.user.id }])
      .select()
    if (error) return

    const rutinaId = data[0].id
    const filas = suplementosRutina
      .filter(s => s.nombre && s.dosis)
      .map(s => ({ rutina_id: rutinaId, nombre: s.nombre, dosis: s.dosis }))

    await supabase.from('rutina_suplementos').insert(filas)
    setNombreRutina('')
    setSuplementosRutina([{ nombre: '', dosis: '' }])
    cargarRutinas()
  }

  const eliminarRutina = async (id: number) => {
    await supabase.from('rutina_suplementos').delete().eq('rutina_id', id)
    await supabase.from('rutinas').delete().eq('id', id)
    setRutinas(rutinas.filter(r => r.id !== id))
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'

  return (
    <div className="mt-8 bg-surface border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Zap size={16} className="text-brand" />
        Rutinas
      </h2>

      {rutinas.length > 0 && (
        <div className="mb-6 space-y-2">
          {rutinas.map(rutina => (
            <div key={rutina.id} className="flex justify-between items-center p-3 bg-surface-2 border border-white/10 rounded-xl">
              <div>
                <p className="font-semibold text-slate-200">{rutina.nombre}</p>
                <p className="text-xs text-slate-500">{rutina.rutina_suplementos.length} suplementos</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAplicarRutina(rutina.rutina_suplementos)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition">
                  <Play size={13} />
                  Aplicar
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

      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Nueva rutina</h3>
      <input
        placeholder="Nombre de la rutina (ej. Stack mañana)"
        value={nombreRutina}
        onChange={e => setNombreRutina(e.target.value)}
        className={`${inputClass} mb-4`}
      />

      {suplementosRutina.map((s, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            placeholder="Nombre"
            value={s.nombre}
            onChange={e => actualizarFila(index, 'nombre', e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Dosis"
            value={s.dosis}
            onChange={e => actualizarFila(index, 'dosis', e.target.value)}
            className={inputClass}
          />
        </div>
      ))}

      <button
        onClick={agregarFilaSuplemento}
        className="flex items-center gap-1.5 text-sm text-brand/70 hover:text-brand transition mb-4 mt-1">
        <Plus size={14} />
        Agregar suplemento a la rutina
      </button>
      <button
        onClick={guardarRutina}
        className="w-full py-2.5 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition">
        Guardar rutina
      </button>
    </div>
  )
}
