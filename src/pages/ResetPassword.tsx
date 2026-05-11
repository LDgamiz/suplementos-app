import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { mapAuthError } from '../lib/authErrors'
import { Button, Card, Input } from '../components/ui'

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
          <p className="text-slate-400 text-sm mt-2">Reset your password</p>
        </div>

        <Card padding="lg" className="shadow-2xl">
          {!ready ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Verifying your reset link...
            </p>
          ) : (
            <>
              <Input
                placeholder="New password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mb-3"
              />
              <Input
                placeholder="Confirm new password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="mb-4"
              />
              <Button onClick={submit} disabled={busy} fullWidth>
                {busy ? 'Updating...' : 'Update password'}
              </Button>
              {error && <p className="text-center text-sm text-rose-400 mt-3">{error}</p>}
              {mensaje && <p className="text-center text-sm text-slate-400 mt-3">{mensaje}</p>}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
