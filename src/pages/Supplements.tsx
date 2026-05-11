import { useState } from 'react'
import { Flame } from 'lucide-react'
import { useSuplementos } from '../hooks/useSuplementos'
import { useRacha } from '../hooks/useRacha'
import { useLayoutCtx } from '../layout/context'
import WeeklyChart from '../WeeklyChart'
import SupplementoItem from '../components/SupplementoItem'
import AgregarSuplemento from '../components/AgregarSuplemento'
import ShareButton from '../components/ShareButton'
import WelcomeEmptyState from '../components/WelcomeEmptyState'
import HintButton from '../components/HintButton'
import Rutinas from '../Rutinas'
import Notificaciones from '../components/Notificaciones'
import { getLocalDateString } from '../lib/dates'

export default function Supplements() {
  const { session, perfil } = useLayoutCtx()
  const [fecha, setFecha] = useState<string>(getLocalDateString())
  const {
    suplementos, refreshKey,
    agregarSuplemento, marcarTomado, eliminarSuplemento,
    aplicarRutina, togglePublico, editarSuplemento
  } = useSuplementos(session, fecha)
  const { racha } = useRacha(session)

  const tomados = suplementos.filter(s => s.tomado).length
  const total = suplementos.length
  const pct = total > 0 ? Math.round((tomados / total) * 100) : 0

  const publicSuplementos = suplementos
    .filter(s => s.publico)
    .map(s => ({
      name: s.suplementos_cat?.name ?? '—',
      dosis: s.dosis,
      tomado: s.tomado,
    }))

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs uppercase tracking-wider text-slate-500 font-medium">Stats</h2>
        <HintButton
          label="Stats hint"
          text="Today is what you've taken so far. Streak counts consecutive 100% days. Share generates a 9:16 image — needs a username."
        />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3 flex flex-col justify-between">
          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Today</p>
          <div className="flex items-end gap-2">
            <span className="font-display text-2xl font-bold text-white tabular-nums">
              {tomados}
              <span className="text-slate-600 text-base font-normal">/{total}</span>
            </span>
            {total > 0 && (
              <span className="text-brand text-sm font-semibold mb-0.5 tabular-nums">{pct}%</span>
            )}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3 flex flex-col justify-between">
          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Streak</p>
          <div className="flex items-center gap-1.5">
            <Flame size={20} className={racha > 0 ? 'text-streak' : 'text-slate-600'} />
            <span className={`font-display text-2xl font-bold tabular-nums ${racha > 0 ? 'text-streak' : 'text-slate-600'}`}>{racha}</span>
          </div>
        </div>
        <ShareButton
          username={perfil?.username ?? null}
          fullName={perfil?.full_name ?? null}
          avatarUrl={perfil?.avatar_url ?? null}
          bio={perfil?.bio ?? null}
          racha={racha}
          tomados={tomados}
          total={total}
          pct={pct}
          suplementos={publicSuplementos}
        />
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

      {suplementos.length === 0 && fecha === getLocalDateString() ? (
        <WelcomeEmptyState onAdd={agregarSuplemento} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-medium">Today's stack</h2>
            <HintButton
              label="Today's stack hint"
              text="Your daily list. Tap Mark to log a dose, the globe to publish it on your public profile, or Edit to change the dose."
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
        </>
      )}

      <AgregarSuplemento onAgregar={agregarSuplemento} userId={session.user.id} />
      <Rutinas session={session} onAplicarRutina={aplicarRutina} />
      <Notificaciones session={session} />
    </>
  )
}
