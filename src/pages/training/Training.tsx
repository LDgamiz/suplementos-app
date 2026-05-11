import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell, Plus, Play, Settings, Hourglass, ChevronRight } from 'lucide-react'
import { useLayoutCtx } from '../../layout/context'
import { useActiveRoutine } from '../../hooks/useActiveRoutine'
import HintButton from '../../components/HintButton'
import ConfirmModal from '../../components/ConfirmModal'
import { Button, Card, Input } from '../../components/ui'
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
        <h1 className="font-display text-xl font-bold text-white tracking-tight">Training</h1>
        <div className="ml-auto">
          <HintButton
            label="Training hint"
            text="Build a weekly routine. Tap any exercise to see how to do it and its variants. Tap Start workout to log sets, reps and weight — they autosave as you go."
          />
        </div>
      </div>

      {/* In-progress banner */}
      {inProgress && (
        <div className="bg-warn/10 border border-warn/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Hourglass size={18} className="text-warn shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              Workout in progress{inProgress.routine_day_name ? ` · ${inProgress.routine_day_name}` : ''}
            </p>
            <p className="text-xs text-slate-400">Started {timeAgo(inProgress.started_at)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setDiscardOpen(true)}>
            Discard
          </Button>
          <Link
            to={`/training/workout/${inProgress.id}`}
            className="px-3 py-1.5 text-xs rounded-lg bg-brand hover:bg-brand-dark text-bg font-bold transition">
            Resume
          </Link>
        </div>
      )}

      {loading && <p className="text-sm text-slate-500 text-center py-10">Loading...</p>}

      {/* No routine */}
      {!loading && !routine && !creating && (
        <Card padding="lg" className="text-center">
          <p className="font-display text-lg font-bold text-slate-100 mb-1 tracking-tight">Forge your weekly routine</p>
          <p className="text-sm text-slate-500 mb-5">
            Map the days. Stack the lifts. Show up.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Create routine
          </Button>
        </Card>
      )}

      {/* Create routine inline form */}
      {!loading && !routine && creating && (
        <Card padding="lg">
          <p className="text-sm font-semibold text-slate-200 mb-3">Name your routine</p>
          <Input
            placeholder="e.g. Push / Pull / Legs"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            className="mb-3"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setCreating(false); setNewName(''); setError(null) }}>
              Cancel
            </Button>
            <Button onClick={handleCreateRoutine} disabled={busy || !newName.trim()}>
              {busy ? 'Creating...' : 'Create'}
            </Button>
          </div>
          {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
        </Card>
      )}

      {/* Today view */}
      {!loading && routine && (
        <>
          <Card padding="lg" className="mb-3">
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
              <p className="text-sm text-slate-500">Rest hard. The next session builds on this one.</p>
            ) : (
              <>
                <ul className="space-y-2 mb-5">
                  {todayExercises.map(ex => (
                    <li key={ex.id}>
                      <Link
                        to={`/training/exercise/${encodeURIComponent(ex.name)}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-white/[0.06] hover:border-brand/30 transition group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 font-medium truncate">{ex.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ex.sets} × {ex.rep_range || '—'}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-brand transition shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => todayDay && handleStart(todayDay.id)}
                  disabled={busy || !!inProgress}
                  fullWidth>
                  <Play size={16} />
                  {inProgress ? 'Resume the active workout above' : 'Start workout'}
                </Button>
                {error && <p className="text-xs text-rose-400 mt-3 text-center">{error}</p>}
              </>
            )}
          </Card>

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
