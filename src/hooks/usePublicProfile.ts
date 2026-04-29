import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export interface PublicPerfil {
  user_id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface PublicSuplemento {
  id: number
  dosis: string
  tomado: boolean
  suplementos_cat: { name: string; category: string } | null
}

export function usePublicProfile(username: string | undefined) {
  const [perfil, setPerfil] = useState<PublicPerfil | null>(null)
  const [suplementosHoy, setSuplementosHoy] = useState<PublicSuplemento[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [notFound, setNotFound] = useState<boolean>(false)

  useEffect(() => {
    if (!username) { setLoading(false); setNotFound(true); return }

    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)

      const { data: p, error } = await supabase
        .from('perfiles')
        .select('user_id, username, full_name, avatar_url, bio, created_at')
        .eq('username', username)
        .maybeSingle()

      if (cancelled) return

      if (error || !p) {
        setNotFound(true)
        setPerfil(null)
        setSuplementosHoy([])
        setLoading(false)
        return
      }

      setPerfil(p as PublicPerfil)

      const hoy = new Date().toISOString().split('T')[0]
      const { data: sups } = await supabase
        .from('suplementos')
        .select('id, dosis, tomado, suplementos_cat(name, category)')
        .eq('user_id', p.user_id)
        .eq('fecha', hoy)
        .eq('publico', true)

      if (cancelled) return
      setSuplementosHoy((sups as unknown as PublicSuplemento[]) ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [username])

  return { perfil, suplementosHoy, loading, notFound }
}
