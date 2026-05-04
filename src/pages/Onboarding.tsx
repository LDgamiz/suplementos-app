import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Pill } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useLayoutCtx } from '../layout/context'

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'
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
    if (!/^[a-z0-9_]{3,30}$/.test(u)) return 'Username must be 3–30 characters: a-z, 0-9 or _'
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
        full_name: fullName.trim() || null,
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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 mb-3">
          <Pill size={26} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Welcome to DailyStack</h1>
        <p className="text-sm text-slate-400 mt-1">
          One-time setup. You can fill the rest later from your Profile.
        </p>
      </div>

      <div className="bg-surface border border-white/[0.08] rounded-2xl p-6">
        <div className="mb-5">
          <label className={labelClass}>Username <span className="text-rose-400">*</span></label>
          <input
            placeholder="pick-a-handle"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className={inputClass}
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Permanent — cannot be changed later. Used for your public profile at <code className="text-slate-400">/perfil/&lt;username&gt;</code>.
          </p>
        </div>

        <div className="border-t border-white/[0.06] pt-5 mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-4">
            Optional — skip if you prefer
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full name</label>
              <input
                placeholder="Jane Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Goal</label>
              <select value={goal} onChange={e => setGoal(e.target.value)} className={inputClass}>
                <option value="">—</option>
                <option value="lose_weight">Lose weight</option>
                <option value="gain_muscle">Gain muscle</option>
                <option value="maintain">Maintain</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Activity level</label>
              <select value={activity} onChange={e => setActivity(e.target.value)} className={inputClass}>
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

        <button
          onClick={save}
          disabled={busy || !username}
          className="w-full py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-50 text-[#0A0E1A] font-bold rounded-xl transition">
          {busy ? 'Saving...' : 'Save and continue'}
        </button>
        {error && <p className="text-center text-sm text-rose-400 mt-3">{error}</p>}
      </div>
    </div>
  )
}
