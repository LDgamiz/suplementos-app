import { useEffect, useState, useRef, ChangeEvent } from 'react'
import { User, Camera, Link2, Copy, Check, Lock, Save } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useLayoutCtx } from '../layout/context'
import { uploadAvatar } from '../lib/avatar'

interface FormState {
  full_name: string
  birth_date: string
  weight_kg: string
  height_cm: string
  gender: string
  country: string
  goal: string
  activity: string
  bio: string
}

const empty: FormState = {
  full_name: '', birth_date: '', weight_kg: '', height_cm: '',
  gender: '', country: '', goal: '', activity: '', bio: ''
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'
const labelClass = 'block text-xs text-slate-400 mb-1.5 font-medium'

export default function Profile() {
  const { session, perfil } = useLayoutCtx()
  const [form, setForm] = useState<FormState>(empty)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [usernameActual, setUsernameActual] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [usernameMsg, setUsernameMsg] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!perfil) return
    setForm({
      full_name: perfil.full_name ?? '',
      birth_date: perfil.birth_date ?? '',
      weight_kg: perfil.weight_kg?.toString() ?? '',
      height_cm: perfil.height_cm?.toString() ?? '',
      gender: perfil.gender ?? '',
      country: perfil.country ?? '',
      goal: perfil.goal ?? '',
      activity: perfil.activity ?? '',
      bio: perfil.bio ?? ''
    })
    setAvatarUrl(perfil.avatar_url)
    setUsernameActual(perfil.username)
  }, [perfil])

  const update = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function guardar() {
    setGuardando(true)
    setMensaje(null)
    const payload = {
      user_id: session.user.id,
      full_name: form.full_name || null,
      birth_date: form.birth_date || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      gender: form.gender || null,
      country: form.country || null,
      goal: form.goal || null,
      activity: form.activity || null,
      bio: form.bio || null
    }
    const { error } = await supabase
      .from('perfiles')
      .upsert(payload, { onConflict: 'user_id' })
    setMensaje(error ? `Error: ${error.message}` : 'Profile saved')
    setTimeout(() => setMensaje(null), 2500)
    setGuardando(false)
  }

  async function handleAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    try {
      const url = await uploadAvatar(file, session.user.id)
      const { error } = await supabase
        .from('perfiles')
        .upsert({ user_id: session.user.id, avatar_url: url }, { onConflict: 'user_id' })
      if (error) throw error
      setAvatarUrl(url)
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'Could not upload avatar')
    }
    setSubiendo(false)
  }

  async function guardarUsername() {
    const u = username.trim().toLowerCase()
    if (!u) return
    setUsernameMsg(null)
    const { error } = await supabase
      .from('perfiles')
      .upsert({ user_id: session.user.id, username: u }, { onConflict: 'user_id' })
    if (error) {
      if (error.message.includes('unique') || error.code === '23505') setUsernameMsg('Username already taken')
      else if (error.message.includes('username cannot be changed')) setUsernameMsg('Username cannot be changed once set')
      else setUsernameMsg(error.message)
    } else {
      setUsernameActual(u)
      setUsername('')
      setUsernameMsg('Username saved')
      setTimeout(() => setUsernameMsg(null), 2000)
    }
  }

  function copiarLink() {
    navigator.clipboard.writeText(`${window.location.origin}/perfil/${usernameActual}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const initials = (form.full_name || session.user.email || '?').slice(0, 2).toUpperCase()
  const urlPerfil = usernameActual ? `${window.location.origin}/perfil/${usernameActual}` : ''

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <User size={18} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Profile</h1>
      </div>

      {/* Avatar */}
      <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 mb-4 flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-xl font-bold">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={subiendo}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand hover:bg-brand-dark text-[#0A0E1A] flex items-center justify-center transition disabled:opacity-50">
            <Camera size={13} />
          </button>
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={handleAvatar}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">
            {form.full_name || session.user.email}
          </p>
          <p className="text-xs text-slate-500">{subiendo ? 'Uploading...' : 'Tap the camera to update'}</p>
        </div>
      </div>

      {/* Personal data */}
      <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 mb-4">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Personal info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Full name</label>
            <input value={form.full_name} onChange={update('full_name')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Birth date</label>
            <input type="date" value={form.birth_date} onChange={update('birth_date')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select value={form.gender} onChange={update('gender')} className={inputClass}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Weight (kg)</label>
            <input type="number" step="0.1" value={form.weight_kg} onChange={update('weight_kg')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Height (cm)</label>
            <input type="number" step="0.1" value={form.height_cm} onChange={update('height_cm')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input value={form.country} onChange={update('country')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Goal</label>
            <select value={form.goal} onChange={update('goal')} className={inputClass}>
              <option value="">—</option>
              <option value="lose_weight">Lose weight</option>
              <option value="gain_muscle">Gain muscle</option>
              <option value="maintain">Maintain</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Activity level</label>
            <select value={form.activity} onChange={update('activity')} className={inputClass}>
              <option value="">—</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very active</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Bio</label>
            <textarea value={form.bio} onChange={update('bio')} rows={3} className={`${inputClass} resize-none`} />
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={guardando}
          className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition disabled:opacity-50">
          <Save size={15} />
          {guardando ? 'Saving...' : 'Save profile'}
        </button>
        {mensaje && <p className="text-sm text-center mt-3 text-slate-400">{mensaje}</p>}
      </div>

      {/* Public profile / username */}
      <div className="bg-surface border border-white/[0.08] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Link2 size={16} className="text-brand" />
          Public profile
        </h2>

        {usernameActual ? (
          <>
            <div className="mb-4 p-3 bg-surface-2 border border-white/10 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Your public link:</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-brand font-medium truncate">{urlPerfil}</p>
                <button
                  onClick={copiarLink}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition shrink-0">
                  {copiado ? <Check size={13} /> : <Copy size={13} />}
                  {copiado ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-surface-2 border border-white/10 rounded-xl">
              <Lock size={14} className="text-slate-500 shrink-0" />
              <p className="text-xs text-slate-400">
                Username <span className="text-slate-200 font-medium">@{usernameActual}</span> is permanent and cannot be changed.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-amber-400/80 mb-3">
              Choose carefully — your username can only be set once.
            </p>
            <input
              placeholder="Pick a username (a-z, 0-9, _)"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className={`${inputClass} mb-3`}
            />
            <button
              onClick={guardarUsername}
              disabled={!username}
              className="w-full py-2.5 bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold rounded-xl transition disabled:opacity-50">
              Create public profile
            </button>
            {usernameMsg && <p className="text-sm text-center mt-3 text-slate-400">{usernameMsg}</p>}
          </>
        )}
      </div>
    </>
  )
}
