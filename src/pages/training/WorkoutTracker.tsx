import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Flag, Trash2 } from 'lucide-react'
import { useWorkout } from '../../hooks/useWorkout'
import type { WorkoutSet } from '../../lib/training'
import { abandonWorkout } from '../../lib/training'
import ConfirmModal from '../../components/ConfirmModal'

const inputClass =
  'w-full px-3 py-2.5 rounded-xl bg-bg border border-white/[0.08] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-base text-center font-semibold tabular-nums'

function formatElapsed(startedAt: string, now: number): string {
  const ms = Math.max(0, now - new Date(startedAt).getTime())
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export default function WorkoutTracker() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loading, workout, exercises, setsByExercise, updateSet, finish, flushPending } = useWorkout(id ?? null)

  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  // Live timer (1s tick).
  useEffect(() => {
    if (!workout || workout.status !== 'in_progress') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [workout])

  const totals = useMemo(() => {
    let completed = 0
    let total = 0
    for (const list of Object.values(setsByExercise)) {
      total += list.length
      completed += list.filter(s => s.completed).length
    }
    return { completed, total }
  }, [setsByExercise])

  async function handleFinish() {
    setFinishOpen(false)
    setBusy(true)
    setError(null)
    try {
      await finish()
      navigate('/training', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish workout')
    } finally {
      setBusy(false)
    }
  }

  async function handleDiscard() {
    if (!id) return
    setDiscardOpen(false)
    setBusy(true)
    try {
      await flushPending().catch(() => { /* keep going */ })
      await abandonWorkout(id)
      navigate('/training', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500 text-center py-10">Loading workout...</p>
  if (!workout) return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-center">
      <p className="text-sm text-slate-300 mb-3">Workout not found.</p>
      <Link to="/training" className="text-sm text-brand hover:underline">Back to Training</Link>
    </div>
  )

  const isInProgress = workout.status === 'in_progress'

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link to="/training" aria-label="Back to Training" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-bold text-white tracking-tight truncate">
            {workout.routine_day_name ?? 'Workout'}
          </h1>
          <p className="text-xs text-slate-500 tabular-nums">
            {isInProgress ? formatElapsed(workout.started_at, now) : 'Completed'}
            {' · '}
            {totals.completed}/{totals.total} sets
          </p>
        </div>
        {isInProgress && (
          <button
            onClick={() => setFinishOpen(true)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-bg font-bold text-sm transition disabled:opacity-50">
            <Flag size={14} />
            Finish
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-400 mb-3 px-3 py-2 bg-rose-400/10 border border-rose-400/20 rounded-xl">
          {error}
        </p>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {exercises.map(ex => (
          <ExerciseCard
            key={ex.id}
            name={ex.name}
            repRange={ex.rep_range}
            sets={setsByExercise[ex.id] ?? []}
            disabled={!isInProgress || busy}
            onUpdate={(setId, patch, opts) => updateSet(setId, patch, opts)}
          />
        ))}
      </div>

      {/* Footer actions */}
      {isInProgress && (
        <button
          onClick={() => setDiscardOpen(true)}
          disabled={busy}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-2 border border-white/10 text-rose-400/80 hover:text-rose-400 hover:border-rose-400/30 transition text-sm font-medium disabled:opacity-50">
          <Trash2 size={14} />
          Discard workout
        </button>
      )}

      <ConfirmModal
        open={finishOpen}
        title="Finish this workout?"
        body={
          totals.completed === totals.total
            ? 'All sets completed. Mark this workout as done.'
            : `${totals.total - totals.completed} sets are not marked complete. Finish anyway?`
        }
        confirmLabel="Finish"
        confirmTone="brand"
        onConfirm={handleFinish}
        onCancel={() => setFinishOpen(false)}
      />

      <ConfirmModal
        open={discardOpen}
        title="Discard this workout?"
        body="The session will be marked abandoned and won't count as a completed workout."
        confirmLabel="Discard"
        confirmTone="danger"
        onConfirm={handleDiscard}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  )
}

// ---------- ExerciseCard ---------------------------------------------------

interface ExerciseCardProps {
  name: string
  repRange: string | null
  sets: WorkoutSet[]
  disabled: boolean
  onUpdate: (setId: string, patch: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'completed'>>, opts?: { immediate?: boolean }) => void
}

function ExerciseCard({ name, repRange, sets, disabled, onUpdate }: ExerciseCardProps) {
  return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-100 truncate">{name}</h2>
        {repRange && <span className="text-xs text-slate-500 ml-3 shrink-0">{repRange} reps</span>}
      </div>

      <div className="grid grid-cols-[2.5rem_1fr_1fr_3rem] gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 px-1">
        <span>Set</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Weight</span>
        <span className="text-center">Done</span>
      </div>

      <div className="space-y-2">
        {sets.map((s, idx) => (
          <SetRow
            key={s.id}
            set={s}
            previous={idx > 0 ? sets[idx - 1] : null}
            disabled={disabled}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- SetRow ---------------------------------------------------------

interface SetRowProps {
  set: WorkoutSet
  previous: WorkoutSet | null
  disabled: boolean
  onUpdate: ExerciseCardProps['onUpdate']
}

function SetRow({ set, previous, disabled, onUpdate }: SetRowProps) {
  // Local mirror so typing is responsive; the hook does the optimistic global update.
  const [reps, setReps] = useState<string>(set.reps != null ? String(set.reps) : '')
  const [weight, setWeight] = useState<string>(set.weight != null ? String(set.weight) : '')

  // Keep local in sync if hook flushes external changes (e.g., auto-prefill from completing previous set).
  useEffect(() => {
    setReps(set.reps != null ? String(set.reps) : '')
    setWeight(set.weight != null ? String(set.weight) : '')
  }, [set.reps, set.weight])

  function commitReps(v: string) {
    setReps(v)
    const n = v === '' ? null : parseInt(v, 10)
    if (v !== '' && (Number.isNaN(n!) || n! < 0)) return
    onUpdate(set.id, { reps: n })
  }

  function commitWeight(v: string) {
    setWeight(v)
    const n = v === '' ? null : parseFloat(v)
    if (v !== '' && (Number.isNaN(n!) || n! < 0)) return
    onUpdate(set.id, { weight: n })
  }

  function toggleCompleted() {
    const next = !set.completed
    // If completing a set with no reps yet but previous set has reps, copy them in.
    if (next && previous && set.reps == null && previous.reps != null) {
      onUpdate(set.id, {
        reps: previous.reps,
        weight: set.weight ?? previous.weight ?? null,
        completed: true,
      }, { immediate: true })
      return
    }
    onUpdate(set.id, { completed: next }, { immediate: true })
  }

  const repsPlaceholder = previous?.reps != null ? String(previous.reps) : '—'
  const weightPlaceholder = previous?.weight != null ? String(previous.weight) : '—'

  return (
    <div className={`grid grid-cols-[2.5rem_1fr_1fr_3rem] gap-2 items-center ${set.completed ? 'opacity-90' : ''}`}>
      <div className="flex items-center justify-center w-10 h-11 rounded-xl bg-surface-2 border border-white/[0.06] text-sm font-bold text-slate-400 tabular-nums">
        {set.set_number}
      </div>
      <input
        type="number" inputMode="numeric" min={0} step={1}
        value={reps}
        onChange={e => commitReps(e.target.value)}
        placeholder={repsPlaceholder}
        disabled={disabled}
        aria-label={`Set ${set.set_number} reps`}
        className={inputClass}
      />
      <input
        type="number" inputMode="decimal" min={0} step="0.5"
        value={weight}
        onChange={e => commitWeight(e.target.value)}
        placeholder={weightPlaceholder}
        disabled={disabled}
        aria-label={`Set ${set.set_number} weight`}
        className={inputClass}
      />
      <button
        type="button"
        onClick={toggleCompleted}
        disabled={disabled}
        aria-label={`Mark set ${set.set_number} ${set.completed ? 'incomplete' : 'complete'}`}
        aria-pressed={set.completed}
        className={`h-11 rounded-xl border transition flex items-center justify-center disabled:opacity-50 ${
          set.completed
            ? 'bg-brand/15 border-brand/40 text-brand'
            : 'bg-surface-2 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
        }`}>
        <Check size={18} />
      </button>
    </div>
  )
}
