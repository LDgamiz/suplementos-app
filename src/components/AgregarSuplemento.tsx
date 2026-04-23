import { useState } from 'react'

interface Props {
  onAgregar: (nombre: string, dosis: string) => void
}

export default function AgregarSuplemento({ onAgregar }: Props) {
  const [nombre, setNombre] = useState('')
  const [dosis, setDosis] = useState('')

  const handleAgregar = () => {
    onAgregar(nombre, dosis)
    setNombre('')
    setDosis('')
  }

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">➕ Agregar suplemento</h2>
      <input
        placeholder="Nombre (ej. Vitamina D)"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <input
        placeholder="Dosis (ej. 1 cápsula)"
        value={dosis}
        onChange={e => setDosis(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <button
        onClick={handleAgregar}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition">
        Agregar
      </button>
    </div>
  )
}