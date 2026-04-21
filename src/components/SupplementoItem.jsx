// Agrega la prop onTogglePublico y el botón:
export default function SupplementoItem({ suple, onMarcar, onEliminar, onTogglePublico }) {
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