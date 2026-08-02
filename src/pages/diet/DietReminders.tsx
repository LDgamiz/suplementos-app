import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, BellOff, Check } from 'lucide-react'
import { useLayoutCtx } from '../../layout/context'
import { subscribeToPush, unsubscribeFromPush, pushSupported } from '../../lib/push'
import { LIMITS, trimToMax } from '../../lib/validation'
import { Button, Card } from '../../components/ui'
import { MEAL_SLOTS, MealSlot, getMealReminders, saveMealReminder } from '../../lib/diet'

type Draft = Record<MealSlot, { hora: string; activa: boolean }>

function emptyDraft(): Draft {
  return MEAL_SLOTS.reduce((acc, s) => {
    acc[s.key] = { hora: s.defaultTime, activa: false }
    return acc
  }, {} as Draft)
}

export default function DietReminders() {
  const { session } = useLayoutCtx()
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supported = pushSupported()

  useEffect(() => {
    let cancelled = false
    getMealReminders(session.user.id)
      .then(rows => {
        if (cancelled) return
        const next = emptyDraft()
        for (const r of rows) {
          if (next[r.slot]) next[r.slot] = { hora: r.hora, activa: r.activa }
        }
        setDraft(next)
      })
      .catch(() => { /* defaults stand */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session.user.id])

  const anyActive = MEAL_SLOTS.some(s => draft[s.key].activa)

  async function requestPermission() {
    setPermission(await Notification.requestPermission())
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const tz = trimToMax(Intl.DateTimeFormat().resolvedOptions().timeZone, LIMITS.timezone.max)
      // One push subscription covers every meal reminder on this device.
      if (anyActive) await subscribeToPush(session.user.id)
      else await unsubscribeFromPush()

      for (const s of MEAL_SLOTS) {
        const { hora, activa } = draft[s.key]
        await saveMealReminder(session.user.id, s.key, hora, activa, tz)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your reminders')
    } finally {
      setSaving(false)
    }
  }

  function update(slot: MealSlot, patch: Partial<{ hora: string; activa: boolean }>) {
    setDraft(prev => ({ ...prev, [slot]: { ...prev[slot], ...patch } }))
  }

  return (
    <>
      <Link
        to="/diet"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-5">
        <ArrowLeft size={15} />
        Diet
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-brand" />
        </div>
        <h1 className="font-display text-xl font-bold text-white tracking-tight">Meal reminders</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Each reminder fires every day at the time you set and names the meal planned for that
        slot today. Days with nothing planned stay quiet.
      </p>

      {!supported && (
        <div className="flex items-start gap-2 p-3 bg-warn/10 border border-warn/20 rounded-xl mb-4">
          <BellOff size={15} className="text-warn mt-0.5 shrink-0" />
          <p className="text-sm text-warn">
            Push notifications aren't supported here. On iPhone, install this app
            (Share → Add to Home Screen) and open it from the home screen.
          </p>
        </div>
      )}

      {supported && permission === 'denied' && (
        <div className="flex items-start gap-2 p-3 bg-rose-400/10 border border-rose-400/20 rounded-xl mb-4">
          <BellOff size={15} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-400">
            You blocked notifications. Enable them in your browser or app settings.
          </p>
        </div>
      )}

      {supported && permission === 'default' && (
        <button
          onClick={requestPermission}
          className="w-full mb-4 py-2.5 flex items-center justify-center gap-2 bg-warn/10 hover:bg-warn/20 border border-warn/30 text-warn font-semibold rounded-xl transition">
          <Bell size={15} />
          Allow notifications
        </button>
      )}

      {supported && permission === 'granted' && (
        <>
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-10">Loading...</p>
          ) : (
            <Card padding="none" className="mb-4 divide-y divide-white/[0.06]">
              {MEAL_SLOTS.map(s => {
                const row = draft[s.key]
                const timeId = `reminder-time-${s.key}`
                const labelId = `reminder-label-${s.key}`
                return (
                  <div key={s.key} className="flex items-center gap-3 p-4">
                    <span id={labelId} className="flex-1 min-w-0 text-sm text-slate-300 truncate">
                      {s.label}
                    </span>
                    <label htmlFor={timeId} className="sr-only">{s.label} reminder time</label>
                    <input
                      id={timeId}
                      type="time"
                      value={row.hora}
                      onChange={e => update(s.key, { hora: e.target.value })}
                      disabled={!row.activa}
                      className="px-3 py-1.5 rounded-lg bg-bg border border-white/[0.08] text-slate-200 tabular-nums focus:outline-none focus:border-brand/50 disabled:opacity-40 transition"
                    />
                    <button
                      onClick={() => update(s.key, { activa: !row.activa })}
                      role="switch"
                      aria-checked={row.activa}
                      aria-labelledby={labelId}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        row.activa ? 'bg-brand' : 'bg-slate-700'
                      }`}>
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                          row.activa ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </Card>
          )}

          <Button onClick={save} disabled={saving || loading} fullWidth>
            {saving ? 'Saving...' : saved ? <><Check size={15} /> Saved</> : 'Save reminders'}
          </Button>

          {error && <p className="text-xs text-rose-400 mt-2 text-center">{error}</p>}
        </>
      )}
    </>
  )
}
