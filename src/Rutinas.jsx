import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function Rutinas({ session, onAplicarRutina }) {
  const [rutinas, setRutinas] = useState([])
  const [nombreRutina, setNombreRutina] = useState('')
  const [suplementosRutina, setSuplementosRutina] = useState([
    { nombre: '', dosis: '' }
  ])

  useEffect(() => {
    cargarRutinas()
  }, [])

  const cargarRutinas = async () => {
    const { data: rutinasData, error } = await supabase
      .from('rutinas')
      .select('*')
      .eq('user_id', session.user.id)
    if (error) return

    const rutinasConSuplemento = await Promise.all(
      rutinasData.map(async (rutina) => {
        const { data: suplementos } = await supabase
          .from('rutina_suplementos')
          .select('*')
          .eq('rutina_id', rutina.id)
        return { ...rutina, rutina_suplementos: suplementos || [] }
      })
    )
    setRutinas(rutinasConSuplemento)
}

  const agregarFilaSuplemento = () => {
    setSuplementosRutina([...suplementosRutina, { nombre: '', dosis: '' }])
  }

  const actualizarFila = (index, campo, valor) => {
    const nuevas = [...suplementosRutina]
    nuevas[index][campo] = valor
    setSuplementosRutina(nuevas)
  }

  const guardarRutina = async () => {
    if (!nombreRutina) return
    const { data, error } = await supabase
      .from('rutinas')
      .insert([{ nombre: nombreRutina, user_id: session.user.id }])
      .select()
    if (error) return

    const rutinaId = data[0].id
    const filas = suplementosRutina
      .filter(s => s.nombre && s.dosis)
      .map(s => ({ rutina_id: rutinaId, nombre: s.nombre, dosis: s.dosis }))

    await supabase.from('rutina_suplementos').insert(filas)
    setNombreRutina('')
    setSuplementosRutina([{ nombre: '', dosis: '' }])
    cargarRutinas()
  }

  const aplicarRutina = async (rutina) => {
    onAplicarRutina(rutina.rutina_suplementos)
  }

  const eliminarRutina = async (id) => {
    await supabase.from('rutina_suplementos').delete().eq('rutina_id', id)
    await supabase.from('rutinas').delete().eq('id', id)
    setRutinas(rutinas.filter(r => r.id !== id))
  }

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">⚡ Rutinas</h2>

      {/* Lista de rutinas guardadas */}
      {rutinas.length > 0 && (
        <div className="mb-6 space-y-3">
          {rutinas.map(rutina => (
            <div key={rutina.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-gray-800">{rutina.nombre}</p>
                <p className="text-xs text-gray-400">
                  {rutina.rutina_suplementos.length} suplementos
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => aplicarRutina(rutina)}
                  className="text-sm px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition">
                  ▶ Aplicar
                </button>
                <button
                  onClick={() => eliminarRutina(rutina.id)}
                  className="text-sm px-3 py-1 rounded-lg bg-white border border-red-200 text-red-400 hover:bg-red-50 transition">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nueva rutina */}
      <h3 className="font-semibold text-gray-700 mb-3">Nueva rutina</h3>
      <input
        placeholder="Nombre de la rutina (ej. Stack mañana)"
        value={nombreRutina}
        onChange={e => setNombreRutina(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      {suplementosRutina.map((s, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            placeholder="Nombre"
            value={s.nombre}
            onChange={e => actualizarFila(index, 'nombre', e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <input
            placeholder="Dosis"
            value={s.dosis}
            onChange={e => actualizarFila(index, 'dosis', e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      ))}

      <button
        onClick={agregarFilaSuplemento}
        className="text-sm text-blue-500 hover:underline mb-4 mt-1">
        + Agregar suplemento a la rutina
      </button>

      <button
        onClick={guardarRutina}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition">
        Guardar rutina
      </button>
    </div>
  )
}

export default Rutinas