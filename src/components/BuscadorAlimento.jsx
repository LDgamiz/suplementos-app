import { useState, useEffect } from 'react'

export default function BuscadorAlimento({ onAgregar }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!busqueda) return
    setCargando(true)
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${busqueda}&json=true&page_size=5`)
      .then(res => res.json())
      .then(data => { setResultados(data.products); setCargando(false) })
  }, [busqueda])

  return (
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
              onClick={() => onAgregar(producto.product_name, producto.nutrition_data_per)}
              className="text-sm px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition">
              ➕ Agregar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}