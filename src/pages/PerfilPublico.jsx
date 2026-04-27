import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function PerfilPublico() {
  const { username } = useParams()
  const [suplementos, setSuplementos] = useState([])
  const [loading, setLoading] = useState(true)
  const [found, setFound] = useState(true)

  useEffect(() => {
    fetchPerfil()
  }, [username])

  async function fetchPerfil() {
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('user_id')
      .eq('username', username)
      .single()

    if (error || !perfil) { setFound(false); setLoading(false); return }

    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('suplementos')
      .select('dosis, tomado, suplementos_cat(name)')
      .eq('user_id', perfil.user_id)
      .eq('fecha', hoy)
      .eq('publico', true)

    setSuplementos(data || [])
    setLoading(false)
  }

  if (loading) return <p className="text-center mt-10 text-gray-400">Loading...</p>
  if (!found) return <p className="text-center mt-10 text-gray-500">Profile not found.</p>

  return (
    <div className="max-w-xl mx-auto mt-10 px-4 font-sans">
      <h1 className="text-2xl font-bold mb-2">💊 Stack of <span className="text-blue-500">@{username}</span></h1>
      <p className="text-sm text-gray-400 mb-6">Today's stack — {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      {suplementos.length === 0
        ? <p className="text-gray-400">No public supplements today.</p>
        : <ul style={{ listStyle: 'none', padding: 0 }}>
            {suplementos.map((s, i) => (
              <li key={i} className={`flex justify-between items-center p-4 mb-3 rounded-xl border ${s.tomado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <span>
                  <span className="font-semibold text-gray-800">{s.suplementos_cat?.name ?? '—'}</span>
                  <span className="text-sm ml-2 text-gray-500">— {s.dosis}</span>
                </span>
                <span className="text-sm">{s.tomado ? '✅' : '⬜'}</span>
              </li>
            ))}
          </ul>
      }
    </div>
  )
}
