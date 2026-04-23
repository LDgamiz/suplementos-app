import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Session } from '@supabase/supabase-js'

export interface Suplemento {
  id: number
  nombre: string
  dosis: string
  tomado: boolean
  publico: boolean
  fecha: string
  user_id: string
  created_at: string
}

export function useSuplementos(session: Session | null, fecha: string) {
  const [suplementos, setSuplementos] = useState<Suplemento[]>([])
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    if (session) cargarSuplemento()
  }, [session, fecha])

  const cargarSuplemento = async () => {
    const { data, error } = await supabase
      .from('suplementos')
      .select('*')
      .eq('user_id', session!.user.id)
      .eq('fecha', fecha)
    if (!error) setSuplementos(data as Suplemento[])
  }

  const agregarSuplemento = async (nombre: string, dosis: string) => {
    if (!nombre || !dosis) return
    const hoy = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('suplementos')
      .insert([{ nombre, dosis, tomado: false, user_id: session!.user.id, fecha: hoy }])
      .select()
    if (!error) setSuplementos(prev => [...prev, data[0] as Suplemento])
  }

  const marcarTomado = async (id: number) => {
    const suple = suplementos.find(s => s.id === id)
    if (!suple) return
    const { error } = await supabase
      .from('suplementos')
      .update({ tomado: !suple.tomado })
      .eq('id', id)
    if (!error) {
      setSuplementos(prev => prev.map(s => s.id === id ? { ...s, tomado: !s.tomado } : s))
      setRefreshKey(prev => prev + 1)
    }
  }

  const eliminarSuplemento = async (id: number) => {
    const { error } = await supabase.from('suplementos').delete().eq('id', id)
    if (!error) setSuplementos(prev => prev.filter(s => s.id !== id))
  }

  const togglePublico = async (id: number, publicoActual: boolean) => {
    const { error } = await supabase
      .from('suplementos')
      .update({ publico: !publicoActual })
      .eq('id', id)
    if (!error) {
      setSuplementos(prev => prev.map(s => s.id === id ? { ...s, publico: !s.publico } : s))
    }
  }

  const editarSuplemento = async (id: number, nombre: string, dosis: string) => {
    const { error } = await supabase
      .from('suplementos')
      .update({ nombre, dosis })
      .eq('id', id)
    if (!error) {
      setSuplementos(prev => prev.map(s => s.id === id ? { ...s, nombre, dosis } : s))
    }
  }

  const aplicarRutina = async (suplementosDeRutina: { nombre: string; dosis: string }[]) => {
    const hoy = new Date().toISOString().split('T')[0]
    const filas = suplementosDeRutina.map(s => ({
      nombre: s.nombre,
      dosis: s.dosis,
      tomado: false,
      user_id: session!.user.id,
      fecha: hoy
    }))
    const { data, error } = await supabase.from('suplementos').insert(filas).select()
    if (!error) setSuplementos(prev => [...prev, ...(data as Suplemento[])])
  }

  return { suplementos, refreshKey, agregarSuplemento, marcarTomado, eliminarSuplemento, aplicarRutina, togglePublico, editarSuplemento }
}