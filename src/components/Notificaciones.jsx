import { useState, useEffect } from 'react'

export default function Notificaciones() {
  const [permiso, setPermiso] = useState(Notification.permission)
  const [hora, setHora] = useState(localStorage.getItem('notif_hora') || '08:00')
  const [activa, setActiva] = useState(localStorage.getItem('notif_activa') === 'true')
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (activa) programarNotificacion(hora)
  }, [])

  async function solicitarPermiso() {
    const resultado = await Notification.requestPermission()
    setPermiso(resultado)
  }

  function programarNotificacion(horaSeleccionada) {
    // Limpiar intervalo anterior
    const idAnterior = localStorage.getItem('notif_timeout_id')
    if (idAnterior) clearTimeout(parseInt(idAnterior))

    const ahora = new Date()
    const [hh, mm] = horaSeleccionada.split(':').map(Number)

    const objetivo = new Date()
    objetivo.setHours(hh, mm, 0, 0)

    // Si la hora ya pasó hoy, programar para mañana
    if (objetivo <= ahora) objetivo.setDate(objetivo.getDate() + 1)

    const msHastaNotif = objetivo - ahora

    const id = setTimeout(() => {
      new Notification('💊 Mis Suplementos', {
        body: '¿Ya tomaste tus suplementos hoy?',
        icon: '/icons/icon-192.png'
      })
      // Reprogramar para el día siguiente (cada 24h)
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

  function toggleActiva(valor) {
    setActiva(valor)
    if (!valor) {
      const id = localStorage.getItem('notif_timeout_id')
      if (id) clearTimeout(parseInt(id))
      localStorage.setItem('notif_activa', 'false')
    }
  }

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">🔔 Recordatorio diario</h2>

      {permiso === 'denied' && (
        <p className="text-sm text-red-400 mb-4">
          Bloqueaste las notificaciones. Actívalas en la configuración del navegador.
        </p>
      )}

      {permiso === 'default' && (
        <button
          onClick={solicitarPermiso}
          className="w-full mb-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold rounded-lg transition">
          Permitir notificaciones
        </button>
      )}

      {permiso === 'granted' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Recordatorio activo</span>
            <button
              onClick={() => toggleActiva(!activa)}
              className={`w-12 h-6 rounded-full transition-colors ${activa ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${activa ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-600">Hora del recordatorio</label>
            <input
              type="time"
              value={hora}
              onChange={e => setHora(e.target.value)}
              disabled={!activa}
              className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40"
            />
          </div>

          <button
            onClick={guardarConfiguracion}
            disabled={!activa}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-40">
            {guardado ? '✅ Guardado' : 'Guardar recordatorio'}
          </button>
        </>
      )}
    </div>
  )
}