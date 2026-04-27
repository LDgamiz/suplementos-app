import { useState } from 'react'
import { supabase } from './supabaseClient'
import { Pill } from 'lucide-react'

export default function Auth() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [esRegistro, setEsRegistro] = useState<boolean>(false)
  const [mensaje, setMensaje] = useState<string>('')

  const handleSubmit = async () => {
    if (esRegistro) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMensaje(error.message)
      else setMensaje('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMensaje(error.message)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #0d1f1a 0%, #0A0E1A 65%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 mb-5">
            <Pill size={30} className="text-brand" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Supplements</h1>
          <p className="text-slate-400 text-sm mt-2">Track your daily stack</p>
        </div>

        <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-5">
            {esRegistro ? 'Create account' : 'Sign in'}
          </h2>
          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={`${inputClass} mb-3`}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={`${inputClass} mb-5`}
          />
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition mb-4">
            {esRegistro ? 'Create account' : 'Sign in'}
          </button>
          <p
            onClick={() => setEsRegistro(!esRegistro)}
            className="text-center text-sm text-brand/70 cursor-pointer hover:text-brand transition">
            {esRegistro ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </p>
          {mensaje && <p className="text-center text-sm text-slate-400 mt-3">{mensaje}</p>}
        </div>
      </div>
    </div>
  )
}
