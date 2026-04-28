import { useState } from 'react'
import { Flame } from 'lucide-react'
import { useSuplementos } from '../hooks/useSuplementos'
import { useRacha } from '../hooks/useRacha'
import { useLayoutCtx } from '../layout/context'
import WeeklyChart from '../WeeklyChart'
import SupplementoItem from '../components/SupplementoItem'
import AgregarSuplemento from '../components/AgregarSuplemento'
import Rutinas from '../Rutinas'
import Notificaciones from '../components/Notificaciones'

export default function Supplements() {
  const { session } = useLayoutCtx()
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const {
    suplementos, refreshKey,
    agregarSuplemento, marcarTomado, eliminarSuplemento,
    aplicarRutina, togglePublico, editarSuplemento
  } = useSuplementos(session, fecha)
  const { racha } = useRacha(session)

  const tomados = suplementos.filter(s => s.tomado).length
  const total = suplementos.length
  const pct = total > 0 ? Math.round((tomados / total) * 100) : 0

  return (
    <>
      <div className="flex items-stretch gap-3 mb-6">
        <div className="flex-1 bg-surface border border-white/[0.08] rounded-2xl px-4 py-3">
          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Today</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">
              {tomados}
              <span className="text-slate-600 text-base font-normal">/{total}</span>
            </span>
            {total > 0 && (
              <span className="text-brand text-sm font-semibold mb-0.5">{pct}%</span>
            )}
          </div>
        </div>
        {racha > 0 && (
          <div className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3 flex flex-col justify-between">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Streak</p>
            <div className="flex items-center gap-1.5">
              <Flame size={20} className="text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{racha}</span>
            </div>
          </div>
        )}
      </div>

      <WeeklyChart refreshKey={refreshKey} />

      <div className="flex justify-center my-6">
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="px-4 py-2 rounded-xl bg-surface border border-white/[0.08] text-slate-300 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition"
        />
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {suplementos.map(s => (
          <SupplementoItem
            key={s.id}
            suple={s}
            onMarcar={marcarTomado}
            onEliminar={eliminarSuplemento}
            onTogglePublico={togglePublico}
            onEditar={editarSuplemento}
          />
        ))}
      </ul>

      <AgregarSuplemento onAgregar={agregarSuplemento} />
      <Rutinas session={session} onAplicarRutina={aplicarRutina} />
      <Notificaciones session={session} />
    </>
  )
}
