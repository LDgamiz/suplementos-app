import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useSuplementes(session, fecha) {
  const [suplementos, setSuplementos] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (session) cargarSuplemento()
  }, [session, fecha])

  const cargarSuplemento = async () => {
    const { data, error } = await supabase
      .from('suplementos')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('fecha', fecha)
    if (!error) setSuplementos(data)
  }

  const agregarSuplemento = async (nombre, dosis) => {
    if (!nombre || !dosis) return
    const hoy = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('suplementos')
      .insert([{ nombre, dosis, tomado: false, user_id: session.user.id, fecha: hoy }])
      .select()
    if (!error) setSuplementos(prev => [...prev, data[0]])
  }

  const marcarTomado = async (id) => {
    const suple = suplementos.find(s => s.id === id)
    const { error } = await supabase
      .from('suplementos')
      .update({ tomado: !suple.tomado })
      .eq('id', id)
    if (!error) {
      setSuplementos(prev => prev.map(s => s.id === id ? { ...s, tomado: !s.tomado } : s))
      setRefreshKey(prev => prev + 1)
    }
  }

  const eliminarSuplemento = async (id) => {
    const { error } = await supabase.from('suplementos').delete().eq('id', id)
    if (!error) setSuplementos(prev => prev.filter(s => s.id !== id))
  }

  const aplicarRutina = async (suplementosDeRutina) => {
    const hoy = new Date().toISOString().split('T')[0]
    const filas = suplementosDeRutina.map(s => ({
      nombre: s.nombre,
      dosis: s.dosis,
      tomado: false,
      user_id: session.user.id,
      fecha: hoy
    }))
    const { data, error } = await supabase.from('suplementos').insert(filas).select()
    if (!error) setSuplementos(prev => [...prev, ...data])
  }

  return { suplementos, refreshKey, agregarSuplemento, marcarTomado, eliminarSuplemento, aplicarRutina }
}