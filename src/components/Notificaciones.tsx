import { useState, useEffect } from 'react'
import { Bell, BellOff, Clock, Check } from 'lucide-react'

export default function Notificaciones() {
  const [permiso, setPermiso] = useState<NotificationPermission>(Notification.permission)
  const [hora, setHora] = useState<string>(localStorage.getItem('notif_hora') || '08:00')
  const [activa, setActiva] = useState<boolean>(localStorage.getItem('notif_activa') === 'true')
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (activa) programarNotificacion(hora)
  }, [])

  async function solicitarPermiso() {
    const resultado = await Notification.requestPermission()
    setPermiso(resultado)
  }

  function programarNotificacion(horaSeleccionada: string) {
    const idAnterior = localStorage.getItem('notif_timeout_id')
    if (idAnterior) clearTimeout(parseInt(idAnterior))

    const ahora = new Date()
    const [hh, mm] = horaSeleccionada.split(':').map(Number)
    const objetivo = new Date()
    objetivo.setHours(hh, mm, 0, 0)
    if (objetivo <= ahora) objetivo.setDate(objetivo.getDate() + 1)

    const msHastaNotif = objetivo.getTime() - ahora.getTime()
    const id = setTimeout(() => {
      new Notification('💊 Mis Suplementos', {
        body: '¿Ya tomaste tus suplementos hoy?',
        icon: '/icons/icon-192.png'
      })
      programarNotificacion(horaSeleccionada)
    }, msHastaNotif)

    localStorage.setItem('notif_timeout_id', id.toString())
  }

  function guardarConfiguracion() {
    localStorage.setItem('notif_hora', hora)
    localStorage.setItem('notif_activa', activa.toString())
    if (activa) programarNotificacion(hora)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  function toggleActiva(valor: boolean) {
    setActiva(valor)
    if (!valor) {
      const id = localStorage.getItem('notif_timeout_id')
      if (id) clearTimeout(parseInt(id))
      localStorage.setItem('notif_activa', 'false')
    }
  }

  return (
    <div className="mt-8 bg-surface border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Bell size={16} className="text-brand" />
        Recordatorio diario
      </h2>

      {permiso === 'denied' && (
        <div className="flex items-start gap-2 p-3 bg-rose-400/10 border border-rose-400/20 rounded-xl mb-4">
          <BellOff size={15} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-400">Bloqueaste las notificaciones. Actívalas en la configuración del navegador.</p>
        </div>
      )}

      {permiso === 'default' && (
        <button
          onClick={solicitarPermiso}
          className="w-full mb-4 py-2.5 flex items-center justify-center gap-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 font-semibold rounded-xl transition">
          <Bell size={15} />
          Permitir notificaciones
        </button>
      )}

      {permiso === 'granted' && (
        <>
          <div className="flex items-center justify-between mb-4 p-3 bg-surface-2 border border-white/10 rounded-xl">
            <span className="text-sm text-slate-300">Recordatorio activo</span>
            <button
              onClick={() => toggleActiva(!activa)}
              className={`w-11 h-6 rounded-full transition-colors relative ${activa ? 'bg-brand' : 'bg-slate-700'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${activa ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4 p-3 bg-surface-2 border border-white/10 rounded-xl">
            <Clock size={15} className="text-slate-400 shrink-0" />
            <label className="text-sm text-slate-300 flex-1">Hora del recordatorio</label>
            <input
              type="time"
              value={hora}
              onChange={e => setHora(e.target.value)}
              disabled={!activa}
              className="px-3 py-1.5 rounded-lg bg-[#0A0E1A] border border-white/[0.08] text-slate-200 focus:outline-none focus:border-brand/50 disabled:opacity-40 transition"
            />
          </div>

          <button
            onClick={guardarConfiguracion}
            disabled={!activa}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition disabled:opacity-40">
            {guardado ? <><Check size={15} /> Guardado</> : 'Guardar recordatorio'}
          </button>
        </>
      )}
    </div>
  )
}
