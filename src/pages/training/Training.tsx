import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell, Plus, Play, Settings, Hourglass } from 'lucide-react'
import { useLayoutCtx } from '../../layout/context'
import { useActiveRoutine } from '../../hooks/useActiveRoutine'
import HintButton from '../../components/HintButton'
import ConfirmModal from '../../components/ConfirmModal'
import {
  createRoutine, setActiveRoutine, startWorkout,
  getInProgressWorkout, abandonWorkout,
  Workout,
} from '../../lib/training'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.max(0, Math.round(ms / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  return `${h}h ago`
}

export default function Training() {
  const { session } = useLayoutCtx()
  const navigate = useNavigate()
  const { routine, days, exercisesByDay, loading, refresh } = useActiveRoutine(session)

  const [inProgress, setInProgress] = useState<Workout | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    getInProgressWorkout(session.user.id)
      .then(w => { if (!cancelled) setInProgress(w) })
      .catch(() => { /* ignore */ })
    return () => { cancelled = true }
  }, [session.user.id])

  async function handleCreateRoutine() {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    setError(null)
    try {
      const r = await createRoutine(session.user.id, name)
      await setActiveRoutine(session.user.id, r.id)
      setCreating(false)
      setNewName('')
      await refresh()
      navigate('/training/routine')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create routine')
    } finally {
      setBusy(false)
    }
  }

  async function handleStart(routineDayId: string) {
    setBusy(true)
    setError(null)
    try {
      const { workoutId } = await startWorkout(session.user.id, routineDayId)
      navigate(`/training/workout/${workoutId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start workout')
    } finally {
      setBusy(false)
    }
  }

  async function handleDiscardInProgress() {
    if (!inProgress) return
    setDiscardOpen(false)
    await abandonWorkout(inProgress.id)
    setInProgress(null)
  }

  const today = new Date().getDay()
  const todayDay = days.find(d => d.day_of_week === today) ?? null
  const todayExercises = todayDay ? (exercisesByDay[todayDay.id] ?? []) : []
  const todayLabel = DAY_NAMES[today]
  const isRestDay = !todayDay || todayExercises.length === 0

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <Dumbbell size={18} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Training</h1>
        <div className="ml-auto">
          <HintButton
            label="Training hint"
            text="Build a weekly routine, then start a workout from today's plan. Sets autosave as you log them."
          />
        </div>
      </div>

      {/* In-progress banner */}
      {inProgress && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Hourglass size={18} className="text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              Workout in progress{inProgress.routine_day_name ? ` · ${inProgress.routine_day_name}` : ''}
            </p>
            <p className="text-xs text-slate-400">Started {timeAgo(inProgress.started_at)}</p>
          </div>
          <button
            onClick={() => setDiscardOpen(true)}
            className="px-3 py-1.5 text-xs rounded-lg bg-surface-2 border border-white/10 text-slate-300 hover:text-rose-400 hover:border-rose-400/30 transition">
            Discard
          </button>
          <Link
            to={`/training/workout/${inProgress.id}`}
            className="px-3 py-1.5 text-xs rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition">
            Resume
          </Link>
        </div>
      )}

      {loading && <p className="text-sm text-slate-500 text-center py-10">Loading...</p>}

      {/* No routine */}
      {!loading && !routine && !creating && (
        <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-center">
          <p className="text-base font-semibold text-slate-200 mb-1">Build your weekly routine</p>
          <p className="text-sm text-slate-500 mb-5">
            Pick days, add exercises, then come back to start a workout.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition">
            <Plus size={16} />
            Create routine
          </button>
        </div>
      )}

      {/* Create routine inline form */}
      {!loading && !routine && creating && (
        <div className="bg-surface border border-white/[0.08] rounded-2xl p-6">
          <p className="text-sm font-semibold text-slate-200 mb-3">Name your routine</p>
          <input
            placeholder="e.g. Push / Pull / Legs"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            className="w-full px-4 py-2.5 mb-3 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setCreating(false); setNewName(''); setError(null) }}
              className="px-4 py-2 text-sm rounded-xl bg-surface-2 border border-white/10 text-slate-300 hover:text-slate-100 hover:border-white/20 transition">
              Cancel
            </button>
            <button
              onClick={handleCreateRoutine}
              disabled={busy || !newName.trim()}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] transition disabled:opacity-50">
              {busy ? 'Creating...' : 'Create'}
            </button>
          </div>
          {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
        </div>
      )}

      {/* Today view */}
      {!loading && routine && (
        <>
          <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 mb-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-0.5">{todayLabel}</p>
                <h2 className="text-base font-semibold text-slate-200">
                  {isRestDay ? 'Rest day' : (todayDay?.name ?? 'Workout')}
                </h2>
              </div>
              {!isRestDay && (
                <p className="text-xs text-slate-500">{todayExercises.length} exercises</p>
              )}
            </div>

            {isRestDay ? (
              <p className="text-sm text-slate-500">No exercises planned for today.</p>
            ) : (
              <>
                <ul className="space-y-2 mb-5">
                  {todayExercises.map(ex => (
                    <li key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-white/[0.06]">
                      <span className="text-sm text-slate-200 font-medium truncate">{ex.name}</span>
                      <span className="text-xs text-slate-500 shrink-0 ml-3">
                        {ex.sets} × {ex.rep_range || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => todayDay && handleStart(todayDay.id)}
                  disabled={busy || !!inProgress}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition disabled:opacity-50">
                  <Play size={16} />
                  {inProgress ? 'Resume the active workout above' : 'Start workout'}
                </button>
                {error && <p className="text-xs text-rose-400 mt-3 text-center">{error}</p>}
              </>
            )}
          </div>

          <Link
            to="/training/routine"
            className="flex items-center justify-center gap-1.5 text-sm text-brand/80 hover:text-brand transition py-2">
            <Settings size={14} />
            Manage routine
          </Link>
        </>
      )}

      <ConfirmModal
        open={discardOpen}
        title="Discard this workout?"
        body="The workout will be marked as abandoned. Sets you've logged are kept in history but won't count as a completed session."
        confirmLabel="Discard"
        confirmTone="danger"
        onConfirm={handleDiscardInProgress}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  )
}
