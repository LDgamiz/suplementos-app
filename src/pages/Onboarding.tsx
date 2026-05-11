import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLayoutCtx } from '../layout/context'
import { LIMITS, isUsername, trimToMax } from '../lib/validation'
import { Button, Card, Input, Eyebrow, fieldClassName } from '../components/ui'

const labelClass = 'block text-xs text-slate-400 mb-1.5 font-medium'

export default function Onboarding() {
  const { session, perfil } = useLayoutCtx()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState(perfil?.full_name ?? '')
  const [goal, setGoal] = useState(perfil?.goal ?? '')
  const [activity, setActivity] = useState(perfil?.activity ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If somehow they already have a username, get out of here.
  if (perfil?.username) return <Navigate to="/" replace />

  function validate(): string | null {
    const u = username.trim().toLowerCase()
    if (!u) return 'Pick a username to continue.'
    if (!isUsername(u)) return 'Username must be 3–30 characters: a-z, 0-9 or _'
    if (fullName.length > LIMITS.fullName.max) return `Full name must be at most ${LIMITS.fullName.max} characters.`
    return null
  }

  async function save() {
    const v = validate()
    if (v) { setError(v); return }
    setError(null)
    setBusy(true)
    const { error: err } = await supabase
      .from('perfiles')
      .upsert({
        user_id: session.user.id,
        username: username.trim().toLowerCase(),
        full_name: trimToMax(fullName, LIMITS.fullName.max) || null,
        goal: goal || null,
        activity: activity || null,
      }, { onConflict: 'user_id' })
    setBusy(false)
    if (err) {
      if (err.code === '23505' || err.message.toLowerCase().includes('unique')) {
        setError('That username is taken. Try another.')
      } else if (err.message.toLowerCase().includes('username cannot be changed')) {
        setError('Username is already set on your profile.')
      } else {
        setError(err.message)
      }
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <img
          src="/Logo.png"
          alt=""
          aria-hidden="true"
          className="inline-block w-14 h-14 rounded-2xl mb-3 object-cover"
        />
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Welcome to StackForge</h1>
        <p className="text-sm text-slate-400 mt-1">
          One-time setup. You can fill the rest later from your Profile.
        </p>
      </div>

      <Card padding="lg">
        <div className="mb-5">
          <label className={labelClass}>Username <span className="text-rose-400">*</span></label>
          <Input
            placeholder="pick-a-handle"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={LIMITS.username.max}
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Permanent — cannot be changed later. Used for your public profile at <code className="text-slate-400">/perfil/&lt;username&gt;</code>.
          </p>
        </div>

        <div className="border-t border-white/[0.06] pt-5 mb-4">
          <Eyebrow className="mb-4">Optional — skip if you prefer</Eyebrow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full name</label>
              <Input
                placeholder="Jane Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                maxLength={LIMITS.fullName.max}
              />
            </div>
            <div>
              <label className={labelClass}>Goal</label>
              <select value={goal} onChange={e => setGoal(e.target.value)} className={fieldClassName('md')}>
                <option value="">—</option>
                <option value="lose_weight">Lose weight</option>
                <option value="gain_muscle">Gain muscle</option>
                <option value="maintain">Maintain</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Activity level</label>
              <select value={activity} onChange={e => setActivity(e.target.value)} className={fieldClassName('md')}>
                <option value="">—</option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very active</option>
              </select>
            </div>
          </div>
        </div>

        <Button onClick={save} disabled={busy || !username} fullWidth>
          {busy ? 'Saving...' : 'Save and continue'}
        </Button>
        {error && <p className="text-center text-sm text-rose-400 mt-3">{error}</p>}
      </Card>
    </div>
  )
}
