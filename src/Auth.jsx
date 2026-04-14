import { useState } from 'react'
import { supabase } from './supabaseClient'

function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [esRegistro, setEsRegistro] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = async () => {
    if (esRegistro) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMensaje(error.message)
      else setMensaje('¡Revisa tu email para confirmar tu cuenta!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMensaje(error.message)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">💊 Mis Suplementos</h1>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
        </h2>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSubmit}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition mb-3">
          {esRegistro ? 'Registrarse' : 'Entrar'}
        </button>
        <p
          onClick={() => setEsRegistro(!esRegistro)}
          className="text-center text-sm text-blue-500 cursor-pointer hover:underline">
          {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </p>
        {mensaje && <p className="text-center text-sm text-gray-500 mt-3">{mensaje}</p>}
      </div>
    </div>
  )
}

export default Auth