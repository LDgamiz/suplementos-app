import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ConfigPerfil({ session }) {
  const [username, setUsername] = useState('')
  const [usernameActual, setUsernameActual] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    cargarPerfil()
  }, [])

  async function cargarPerfil() {
    const { data } = await supabase
      .from('perfiles')
      .select('username')
      .eq('user_id', session.user.id)
      .single()
    if (data) setUsernameActual(data.username)
  }

  async function guardarUsername() {
    if (!username.trim()) return
    setGuardando(true)
    setMensaje(null)

    const { error } = await supabase
      .from('perfiles')
      .upsert({ user_id: session.user.id, username: username.trim().toLowerCase() },
               { onConflict: 'user_id' })

    if (error) {
      setMensaje(error.message.includes('unique') ? '❌ Ese username ya está tomado' : '❌ Error al guardar')
    } else {
      setUsernameActual(username.trim().toLowerCase())
      setMensaje('✅ Username guardado')
      setUsername('')
    }
    setGuardando(false)
  }

  const urlPerfil = `${window.location.origin}/perfil/${usernameActual}`

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">🔗 Perfil público</h2>

      {usernameActual && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Tu link público:</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-blue-600 font-medium truncate">{urlPerfil}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(urlPerfil); setMensaje('📋 Link copiado') }}
              className="text-xs px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition shrink-0">
              Copiar
            </button>
          </div>
        </div>
      )}

      <input
        placeholder={usernameActual ? `Cambiar (actual: @${usernameActual})` : 'Elige tu username (ej. ldgamiz)'}
        value={username}
        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      <button
        onClick={guardarUsername}
        disabled={guardando}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50">
        {guardando ? 'Guardando...' : usernameActual ? 'Actualizar username' : 'Crear perfil público'}
      </button>

      {mensaje && <p className="text-sm text-center mt-3 text-gray-600">{mensaje}</p>}
    </div>
  )
}