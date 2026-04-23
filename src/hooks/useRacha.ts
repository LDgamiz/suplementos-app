import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Session } from '@supabase/supabase-js'

export function useRacha(session: Session | null) {
  const [racha, setRacha] = useState<number>(0)

  useEffect(() => {
    if (session) calcularRacha()
  }, [session])

  async function calcularRacha() {
    const { data, error } = await supabase
      .from('suplementos')
      .select('fecha, tomado')
      .eq('user_id', session!.user.id)
      .order('fecha', { ascending: false })

    if (error || !data.length) return

    const porFecha: Record<string, { total: number; tomados: number }> = {}
    data.forEach(s => {
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

    setRacha(racha)
  }

  return { racha }
}