import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { mapAuthError } from '../lib/authErrors'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Supabase intercambia el token de la URL automáticamente y emite
    // PASSWORD_RECOVERY. También chequeamos si ya hay sesión por si el
    // usuario llegó con la sesión activa.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function submit() {
    setError(null)
    setMensaje(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) {
      setError(mapAuthError(err.message))
    } else {
      setMensaje('Password updated. Redirecting...')
      setTimeout(() => navigate('/', { replace: true }), 1500)
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
          <h1 className="text-3xl font-bold text-white tracking-tight">DailyStack</h1>
          <p className="text-slate-400 text-sm mt-2">Reset your password</p>
        </div>

        <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          {!ready ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Verifying your reset link...
            </p>
          ) : (
            <>
              <input
                placeholder="New password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputClass} mb-3`}
              />
              <input
                placeholder="Confirm new password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`${inputClass} mb-4`}
              />
              <button
                onClick={submit}
                disabled={busy}
                className="w-full py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-50 text-[#0A0E1A] font-bold rounded-xl transition">
                {busy ? 'Updating...' : 'Update password'}
              </button>
              {error && <p className="text-center text-sm text-rose-400 mt-3">{error}</p>}
              {mensaje && <p className="text-center text-sm text-slate-400 mt-3">{mensaje}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
