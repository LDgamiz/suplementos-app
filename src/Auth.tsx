import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { mapAuthError, isEmailNotConfirmed } from './lib/authErrors'
import { Button, Card, Input } from './components/ui'

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
          <img
            src="/Logo.png"
            alt=""
            aria-hidden="true"
            className="inline-block w-16 h-16 rounded-2xl mb-5 object-cover"
          />
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">StackForge</h1>
          <p className="text-xs text-brand/80 mt-2 uppercase tracking-[0.2em] font-semibold">Train · Stack · Repeat</p>
          <p className="text-slate-500 text-xs mt-1">Fitness Tracker</p>
        </div>

        <Card padding="lg" className="shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-5">{heading}</h2>

          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mb-3"
          />

          {mode !== 'forgot' && (
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mb-2"
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

          <Button
            onClick={handleSubmit}
            disabled={busy}
            fullWidth
            className="mb-4">
            {busy ? 'Working...' : submitLabel}
          </Button>

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
        </Card>

        <p className="text-center text-[10px] text-slate-600 mt-6 space-x-3">
          <Link to="/privacy" className="hover:text-slate-400 transition">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms" className="hover:text-slate-400 transition">Terms</Link>
        </p>
      </div>
    </div>
  )
}
