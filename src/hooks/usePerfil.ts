import { useState, useEffect, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export interface Perfil {
  id: string
  user_id: string
  username: string | null
  full_name: string | null
  birth_date: string | null
  weight_kg: number | null
  height_cm: number | null
  gender: string | null
  avatar_url: string | null
  bio: string | null
  country: string | null
  goal: string | null
  activity: string | null
  role: 'user' | 'admin'
  created_at: string
}

export function usePerfil(session: Session | null) {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    if (!session) { setPerfil(null); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
    setPerfil((data as Perfil) ?? null)
    setLoading(false)
  }, [session])

  useEffect(() => { cargar() }, [cargar])

  return { perfil, loading, refresh: cargar }
}
