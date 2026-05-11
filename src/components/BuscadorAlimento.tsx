import { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button, Card, Input } from './ui'

interface Producto {
  product_name: string
  nutrition_data_per: string
  nutriments?: { energy_value?: number }
}

interface Props {
  onAgregar: (nombre: string, dosis: string) => void
}

export default function BuscadorAlimento({ onAgregar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!busqueda) return
    setCargando(true)
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${busqueda}&json=true&page_size=5`)
      .then(res => res.json())
      .then(data => { setResultados(data.products); setCargando(false) })
  }, [busqueda])

  return (
    <Card padding="lg" className="mt-8">
      <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Search size={16} className="text-brand" />
        Buscar alimento
      </h2>
      <Input
        placeholder="Ej. whey protein, creatine..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="mb-4"
      />
      {cargando && <p className="text-center text-slate-500 text-sm">Buscando...</p>}
      <ul className="space-y-2 mt-2">
        {resultados.map((producto, index) => (
          <li key={index} className="flex justify-between items-center p-4 bg-surface-2 border border-white/10 rounded-xl">
            <div>
              <p className="font-semibold text-slate-200">{producto.product_name || 'Sin nombre'}</p>
              <p className="text-sm text-slate-500">Calorías: {producto.nutriments?.energy_value || 'N/A'} kcal</p>
            </div>
            <Button
              onClick={() => onAgregar(producto.product_name, producto.nutrition_data_per)}
              size="sm"
              className="shrink-0">
              <Plus size={14} />
              Agregar
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
