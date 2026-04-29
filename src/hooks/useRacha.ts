import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Session } from '@supabase/supabase-js'

function useRachaInternal(userId: string | null, publicOnly: boolean) {
  const [racha, setRacha] = useState<number>(0)

  useEffect(() => {
    if (!userId) { setRacha(0); return }
    calcular(userId, publicOnly).then(setRacha)
  }, [userId, publicOnly])

  return { racha }
}

async function calcular(userId: string, publicOnly: boolean): Promise<number> {
  let query = supabase
    .from('suplementos')
    .select('fecha, tomado')
    .eq('user_id', userId)
  if (publicOnly) query = query.eq('publico', true)
  const { data, error } = await query.order('fecha', { ascending: false })

  if (error || !data?.length) return 0

  const porFecha: Record<string, { total: number; tomados: number }> = {}
  data.forEach((s: { fecha: string; tomado: boolean }) => {
    if (!porFecha[s.fecha]) porFecha[s.fecha] = { total: 0, tomados: 0 }
    porFecha[s.fecha].total++
    if (s.tomado) porFecha[s.fecha].tomados++
  })

  let racha = 0
  const hoy = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const dia = porFecha[key]
    if (!dia || dia.tomados < dia.total || dia.total === 0) break
    racha++
  }
  return racha
}

export function useRacha(session: Session | null) {
  return useRachaInternal(session?.user.id ?? null, false)
}

export function useRachaForUser(userId: string | null, publicOnly = false) {
  return useRachaInternal(userId, publicOnly)
}
