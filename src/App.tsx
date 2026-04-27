import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSuplementos } from './hooks/useSuplementos'
import Auth from './Auth'
import Rutinas from './Rutinas'
import WeeklyChart from './WeeklyChart'
import SupplementoItem from './components/SupplementoItem'
import AgregarSuplemento from './components/AgregarSuplemento'
import { Routes, Route } from 'react-router-dom'
import PerfilPublico from './pages/PerfilPublico'
import ConfigPerfil from './components/ConfigPerfil'
import Notificaciones from './components/Notificaciones'
import { useRacha } from './hooks/useRacha'
import { Pill, Flame, LogOut } from 'lucide-react'

function App() {
  const { session, signOut } = useAuth()
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const { suplementos, refreshKey, agregarSuplemento, marcarTomado, eliminarSuplemento, aplicarRutina, togglePublico, editarSuplemento } = useSuplementos(session, fecha)
  const { racha } = useRacha(session)

  if (!session) return <Auth />

  const tomados = suplementos.filter(s => s.tomado).length
  const total = suplementos.length
  const pct = total > 0 ? Math.round((tomados / total) * 100) : 0

  return (
    <Routes>
      <Route path="/perfil/:username" element={<PerfilPublico />} />
      <Route path="/*" element={
        <div className="max-w-xl mx-auto px-4 pb-12 pt-6">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <Pill size={18} className="text-brand" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">My Supplements</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-0.5 truncate max-w-[140px]">{session.user.email}</p>
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-xs text-rose-400/70 hover:text-rose-400 transition ml-auto">
                <LogOut size={11} />
                Sign out
              </button>
            </div>
          </div>

          {/* Stats bar */}
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

          {/* Date picker */}
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
          <ConfigPerfil session={session} />
          <Notificaciones />
        </div>
      } />
    </Routes>
  )
}

export default App
