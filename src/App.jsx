import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'

function App() {
  const [session, setSession] = useState(null)
  const [suplementos, setSuplementos] = useState([])

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaDosis, setNuevaDosis] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)

  const agregarSuplemento = async (nombre = nuevoNombre, dosis = nuevaDosis) => {
    if (!nombre || !dosis) return
    const { data, error } = await supabase
      .from('suplementos')
      .insert([{ nombre, dosis, tomado: false, user_id: session.user.id }])
      .select()
    if (!error) {
      setSuplementos([...suplementos, data[0]])
      setNuevoNombre('')
      setNuevaDosis('')
    }
  }

  const marcarTomado = async (id) => {
    const suplemendo = suplementos.find(s => s.id === id)
    const { error } = await supabase
      .from('suplementos')
      .update({ tomado: !suplemendo.tomado })
      .eq('id', id)
    if (!error) {
      setSuplementos(suplementos.map(s =>
        s.id === id ? { ...s, tomado: !s.tomado } : s
      ))
    }
  }

  const deleteSuplemento = async (id) => {
    const { error } = await supabase
      .from('suplementos')
      .delete()
      .eq('id', id)
    if (!error) {
      setSuplementos(suplementos.filter(s => s.id !== id))
    }
  }

  const buscarAlimento = () => {
  if (!busqueda) return
    setCargando(true)
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${busqueda}&json=true&page_size=5`)
      .then(res => res.json())
      .then(data => {

        setResultados(data.products)
        setCargando(false)
      })
  }
  useEffect(() => {
    if (!busqueda) return
      buscarAlimento()
  }, [busqueda])

  useEffect(() => {
    if (session) cargarSuplemento()
  }, [session])

  const cargarSuplemento = async () => {
    const { data, error } = await supabase
      .from('suplementos')
      .select('*')
      .eq('user_id', session.user.id)
    if (!error) setSuplementos(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (!session) return <Auth />
  return (
    <div className="max-w-xl mx-auto mt-10 px-4 font-sans">
      <button
        onClick={() => supabase.auth.signOut()}
        className="block ml-auto text-sm text-gray-400 hover:text-red-400 transition mb-4">
        Cerrar sesión →
      </button>
      <h1 className="text-3xl font-bold text-center mb-2">💊 Mis Suplementos</h1>
      <p className="text-center text-gray-500 mb-6">
        ✅ {suplementos.filter(s => s.tomado).length} de {suplementos.length} tomados
      </p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {suplementos.map(s => (
          <li key={s.id} className={`flex justify-between items-center p-4 mb-3 rounded-xl border transition-all ${s.tomado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <span className={s.tomado ? 'line-through text-gray-400' : 'text-gray-800'}>
              <span className="font-semibold">{s.nombre}</span>
              <span className="text-sm ml-2 text-gray-500">— {s.dosis}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => marcarTomado(s.id)}
                className="text-sm px-3 py-1 rounded-lg bg-white border border-gray-300 hover:bg-green-100 transition">
                {s.tomado ? '✅ Tomado' : '⬜ Marcar'}
              </button>
              <button
                onClick={() => deleteSuplemento(s.id)}
                className="text-sm px-3 py-1 rounded-lg bg-white border border-red-200 text-red-400 hover:bg-red-50 transition">
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Formulario para agregar */}
      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">➕ Agregar suplemento</h2>
        <input
          placeholder="Nombre (ej. Vitamina D)"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          placeholder="Dosis (ej. 1 cápsula)"
          value={nuevaDosis}
          onChange={e => setNuevaDosis(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={() => agregarSuplemento()}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition">
          Agregar
        </button>
      </div>

      {/* Buscador */}
      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">🔍 Buscar alimento</h2>
        <input
          placeholder="Ej. whey protein, creatine..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300"
        />

        {cargando && <p className="text-center text-gray-400 text-sm">Buscando...</p>}

        <ul className="space-y-3 mt-2">
          {resultados.map((producto, index) => (
            <li key={index} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-gray-800">{producto.product_name || 'Sin nombre'}</p>
                <p className="text-sm text-gray-500">Calorías: {producto.nutriments?.energy_value || 'N/A'} kcal</p>
              </div>
              <button
                onClick={() => agregarSuplemento(producto.product_name, producto.nutrition_data_per)}
                className="text-sm px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition">
                ➕ Agregar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>

  )
}

export default App