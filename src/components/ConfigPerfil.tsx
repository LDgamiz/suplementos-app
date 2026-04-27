import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Link2, Copy, Check } from 'lucide-react'

interface Props {
  session: Session
}

export default function ConfigPerfil({ session }: Props) {
  const [username, setUsername] = useState('')
  const [usernameActual, setUsernameActual] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

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
      setMensaje(error.message.includes('unique') ? '❌ Username already taken' : '❌ Error saving')
    } else {
      setUsernameActual(username.trim().toLowerCase())
      setMensaje('Username saved')
      setUsername('')
    }
    setGuardando(false)
  }

  function copiarLink() {
    navigator.clipboard.writeText(`${window.location.origin}/perfil/${usernameActual}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const urlPerfil = `${window.location.origin}/perfil/${usernameActual}`

  return (
    <div className="mt-8 bg-surface border border-white/[0.08] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Link2 size={16} className="text-brand" />
        Public profile
      </h2>
      {usernameActual && (
        <div className="mb-4 p-3 bg-surface-2 border border-white/10 rounded-xl">
          <p className="text-xs text-slate-500 mb-1">Your public link:</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-brand font-medium truncate">{urlPerfil}</p>
            <button
              onClick={copiarLink}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition shrink-0">
              {copiado ? <Check size={13} /> : <Copy size={13} />}
              {copiado ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
      <input
        placeholder={usernameActual ? `Change (current: @${usernameActual})` : 'Choose your username (e.g. ldgamiz)'}
        value={username}
        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        className="w-full mb-3 px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition"
      />
      <button
        onClick={guardarUsername}
        disabled={guardando}
        className="w-full py-2.5 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition disabled:opacity-50">
        {guardando ? 'Saving...' : usernameActual ? 'Update username' : 'Create public profile'}
      </button>
      {mensaje && <p className="text-sm text-center mt-3 text-slate-400">{mensaje}</p>}
    </div>
  )
}
