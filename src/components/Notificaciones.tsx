import { useState, useEffect } from 'react'
import { Bell, BellOff, Clock, Check } from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { subscribeToPush, unsubscribeFromPush, pushSupported } from '../lib/push'

interface Props {
  session: Session
}

export default function Notificaciones({ session }: Props) {
  const [permiso, setPermiso] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [hora, setHora] = useState('08:00')
  const [activa, setActiva] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supported = pushSupported()

  useEffect(() => { cargarConfig() }, [])

  async function cargarConfig() {
    const { data } = await supabase
      .from('notif_settings')
      .select('hora, activa')
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (data) { setHora(data.hora); setActiva(data.activa) }
  }

  async function solicitarPermiso() {
    const r = await Notification.requestPermission()
    setPermiso(r)
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (activa) {
        await subscribeToPush(session.user.id)
      } else {
        await unsubscribeFromPush()
      }
      const { error: dbError } = await supabase
        .from('notif_settings')
        .upsert({ user_id: session.user.id, hora, activa, timezone: tz },
                { onConflict: 'user_id' })
      if (dbError) throw dbError
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save reminder')
    }
    setGuardando(false)
  }

  return (
    <div className="mt-8 bg-surface border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Bell size={16} className="text-brand" />
        Daily reminder
      </h2>

      {!supported && (
        <div className="flex items-start gap-2 p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl mb-4">
          <BellOff size={15} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-400">
            Push notifications aren't supported here. On iPhone, install this app
            (Share → Add to Home Screen) and open it from the home screen.
          </p>
        </div>
      )}

      {supported && permiso === 'denied' && (
        <div className="flex items-start gap-2 p-3 bg-rose-400/10 border border-rose-400/20 rounded-xl mb-4">
          <BellOff size={15} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-400">You blocked notifications. Enable them in your browser/app settings.</p>
        </div>
      )}

      {supported && permiso === 'default' && (
        <button
          onClick={solicitarPermiso}
          className="w-full mb-4 py-2.5 flex items-center justify-center gap-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 font-semibold rounded-xl transition">
          <Bell size={15} />
          Allow notifications
        </button>
      )}

      {supported && permiso === 'granted' && (
        <>
          <div className="flex items-center justify-between mb-4 p-3 bg-surface-2 border border-white/10 rounded-xl">
            <span className="text-sm text-slate-300">Reminder active</span>
            <button
              onClick={() => setActiva(!activa)}
              className={`w-11 h-6 rounded-full transition-colors relative ${activa ? 'bg-brand' : 'bg-slate-700'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${activa ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4 p-3 bg-surface-2 border border-white/10 rounded-xl">
            <Clock size={15} className="text-slate-400 shrink-0" />
            <label className="text-sm text-slate-300 flex-1">Reminder time</label>
            <input
              type="time"
              value={hora}
              onChange={e => setHora(e.target.value)}
              disabled={!activa}
              className="px-3 py-1.5 rounded-lg bg-[#0A0E1A] border border-white/[0.08] text-slate-200 focus:outline-none focus:border-brand/50 disabled:opacity-40 transition"
            />
          </div>

          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition disabled:opacity-40">
            {guardando ? 'Saving...' : guardado ? <><Check size={15} /> Saved</> : 'Save reminder'}
          </button>

          {error && <p className="text-xs text-rose-400 mt-2 text-center">{error}</p>}
        </>
      )}
    </div>
  )
}
