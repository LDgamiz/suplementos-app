import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { Pill } from 'lucide-react'
import { mapAuthError, isEmailNotConfirmed } from './lib/authErrors'

type Mode = 'signin' | 'signup' | 'forgot'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('signin')
  const [mensaje, setMensaje] = useState('')
  const [lastError, setLastError] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    setBusy(true)
    setMensaje('')
    setLastError(undefined)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setLastError(error.message)
          setMensaje(mapAuthError(error.message))
        } else {
          setMensaje('Check your email to confirm your account.')
        }
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setLastError(error.message)
          setMensaje(mapAuthError(error.message))
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) {
          setLastError(error.message)
          setMensaje(mapAuthError(error.message))
        } else {
          setMensaje('If an account exists for this email, a reset link is on its way.')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  async function resendConfirmation() {
    if (!email) return
    setBusy(true)
    setMensaje('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setBusy(false)
    setMensaje(error ? mapAuthError(error.message) : 'Confirmation email re-sent. Check your inbox.')
    setLastError(undefined)
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'

  const heading =
    mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Reset password' : 'Sign in'
  const submitLabel =
    mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'

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
          <p className="text-slate-400 text-sm mt-2">Supplement Tracker</p>
        </div>

        <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-5">{heading}</h2>

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={`${inputClass} mb-3`}
          />

          {mode !== 'forgot' && (
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`${inputClass} mb-2`}
            />
          )}

          {mode === 'signin' && (
            <p
              onClick={() => { setMode('forgot'); setMensaje(''); setLastError(undefined) }}
              className="text-right text-xs text-brand/70 cursor-pointer hover:text-brand transition mb-4">
              Forgot password?
            </p>
          )}

          {mode === 'forgot' && <div className="mb-3" />}

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-50 text-[#0A0E1A] font-bold rounded-xl transition mb-4">
            {busy ? 'Working...' : submitLabel}
          </button>

          {mode !== 'forgot' && (
            <p
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMensaje(''); setLastError(undefined) }}
              className="text-center text-sm text-brand/70 cursor-pointer hover:text-brand transition">
              {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </p>
          )}

          {mode === 'forgot' && (
            <p
              onClick={() => { setMode('signin'); setMensaje(''); setLastError(undefined) }}
              className="text-center text-sm text-brand/70 cursor-pointer hover:text-brand transition">
              Back to sign in
            </p>
          )}

          {mensaje && <p className="text-center text-sm text-slate-400 mt-3">{mensaje}</p>}

          {isEmailNotConfirmed(lastError) && (
            <p className="text-center text-sm mt-2">
              <button
                onClick={resendConfirmation}
                disabled={busy || !email}
                className="text-brand hover:underline disabled:opacity-50 disabled:no-underline">
                Resend confirmation email
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6 space-x-3">
          <Link to="/privacy" className="hover:text-slate-400 transition">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms" className="hover:text-slate-400 transition">Terms</Link>
        </p>
      </div>
    </div>
  )
}
