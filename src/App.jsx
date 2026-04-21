import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSuplementes } from './hooks/useSuplementos'
import Auth from './Auth'
import Rutinas from './Rutinas'
import WeeklyChart from './WeeklyChart'
import SupplementoItem from './components/SupplementoItem'
import AgregarSuplemento from './components/AgregarSuplemento'
import BuscadorAlimento from './components/BuscadorAlimento'
import { Routes, Route } from 'react-router-dom'
import PerfilPublico from './pages/PerfilPublico'
import ConfigPerfil from './components/ConfigPerfil'
import Notificaciones from './components/Notificaciones'

function App() {
  const { session, signOut } = useAuth()
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const { suplementos, refreshKey, agregarSuplemento, marcarTomado, eliminarSuplemento, aplicarRutina, togglePublico } = useSuplementes(session, fecha)

  if (!session) return <Auth />

  return (
    <Routes>
      <Route path="/perfil/:username" element={<PerfilPublico />} />
      <Route path="/*" element={
      <div className="max-w-xl mx-auto mt-6 px-4 font-sans pb-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">💊 Mis Suplementos</h1>
          <div className="text-right">
            <p className="text-xs text-gray-400">{session.user.email}</p>
            <button onClick={signOut} className="text-xs text-red-400 hover:underline transition">
              Cerrar sesión
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 mb-6">
          ✅ {suplementos.filter(s => s.tomado).length} de {suplementos.length} tomados
        </p>

        <WeeklyChart refreshKey={refreshKey} />

        <div className="flex justify-center my-6">
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {suplementos.map(s => (
            <SupplementoItem key={s.id} suple={s} onMarcar={marcarTomado} onEliminar={eliminarSuplemento} onTogglePublico={togglePublico} />
          ))}
        </ul>

        <AgregarSuplemento onAgregar={agregarSuplemento} />
        <Rutinas session={session} onAplicarRutina={aplicarRutina} />
        <BuscadorAlimento onAgregar={agregarSuplemento} />
        <ConfigPerfil session={session} />
        <Notificaciones />
      </div>
      } />
    </Routes>
  )
}

export default App