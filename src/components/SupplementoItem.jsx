import { useState } from 'react'

export default function SupplementoItem({ suple, onMarcar, onEliminar, onTogglePublico, onEditar }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(suple.nombre)
  const [dosis, setDosis] = useState(suple.dosis)

  function guardar() {
    if (!nombre.trim() || !dosis.trim()) return
    onEditar(suple.id, nombre.trim(), dosis.trim())
    setEditando(false)
  }

  function cancelar() {
    setNombre(suple.nombre)
    setDosis(suple.dosis)
    setEditando(false)
  }

  if (editando) return (
    <li className="p-4 mb-3 rounded-xl border border-blue-200 bg-blue-50">
      <div className="flex gap-2 mb-2">
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          placeholder="Nombre"
        />
        <input
          value={dosis}
          onChange={e => setDosis(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          placeholder="Dosis"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={cancelar} className="text-xs px-3 py-1 rounded-lg bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button onClick={guardar} className="text-xs px-3 py-1 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition">
          Guardar
        </button>
      </div>
    </li>
  )

  return (
    <li className={`flex justify-between items-center p-4 mb-3 rounded-xl border transition-all ${suple.tomado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <span className={suple.tomado ? 'line-through text-gray-400' : 'text-gray-800'}>
        <span className="font-semibold">{suple.nombre}</span>
        <span className="text-sm ml-2 text-gray-500">— {suple.dosis}</span>
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onTogglePublico(suple.id, suple.publico)}
          title={suple.publico ? 'Quitar del perfil público' : 'Mostrar en perfil público'}
          className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg border transition ${suple.publico ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-white border-gray-300 text-gray-400 hover:bg-blue-50'}`}>
          🌐
        </button>
        <button
          onClick={() => setEditando(true)}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg bg-white border border-gray-300 hover:bg-yellow-50 transition">
          ✏️
        </button>
        <button
          onClick={() => onMarcar(suple.id)}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg bg-white border border-gray-300 hover:bg-green-100 transition">
          {suple.tomado ? '✅ Tomado' : '⬜ Marcar'}
        </button>
        <button
          onClick={() => onEliminar(suple.id)}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg bg-white border border-red-200 text-red-400 hover:bg-red-50 transition">
          🗑️
        </button>
      </div>
    </li>
  )
}