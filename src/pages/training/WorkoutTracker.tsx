import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Hourglass, Trash2 } from 'lucide-react'
import { abandonWorkout, getWorkoutFull, WorkoutFull } from '../../lib/training'
import ConfirmModal from '../../components/ConfirmModal'

// Stub for C4. Loads the workout so the user can verify startWorkout
// produced the expected snapshot, and lets them discard.

export default function WorkoutTracker() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<WorkoutFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [discardOpen, setDiscardOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getWorkoutFull(id)
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  async function discard() {
    if (!id) return
    setDiscardOpen(false)
    await abandonWorkout(id)
    navigate('/training', { replace: true })
  }

  if (loading) return <p className="text-sm text-slate-500 text-center py-10">Loading workout...</p>
  if (!data) return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-center">
      <p className="text-sm text-slate-300 mb-3">Workout not found.</p>
      <Link to="/training" className="text-sm text-brand hover:underline">Back to Training</Link>
    </div>
  )

  const { workout, exercises, sets } = data

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/training" aria-label="Back to Training" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">
          {workout.routine_day_name ?? 'Workout'}
        </h1>
      </div>

      <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <Hourglass size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-slate-200">
          <p className="font-semibold mb-1">Tracker UI lands in the next commit.</p>
          <p className="text-xs text-slate-400">
            For now this page just verifies the workout was seeded correctly:
            {' '}<strong>{exercises.length}</strong> exercises,
            {' '}<strong>{sets.length}</strong> empty sets ready to log.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-white/[0.08] rounded-2xl p-4 mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Snapshot</p>
        <ul className="space-y-2">
          {exercises.map(ex => {
            const exSets = sets.filter(s => s.workout_exercise_id === ex.id)
            return (
              <li key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-white/[0.06]">
                <span className="text-sm text-slate-200 font-medium truncate">{ex.name}</span>
                <span className="text-xs text-slate-500 shrink-0 ml-3">
                  {exSets.length} sets · {ex.rep_range || '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <button
        onClick={() => setDiscardOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-2 border border-white/10 text-rose-400/80 hover:text-rose-400 hover:border-rose-400/30 transition text-sm font-medium">
        <Trash2 size={14} />
        Discard workout
      </button>

      <ConfirmModal
        open={discardOpen}
        title="Discard this workout?"
        body="The session will be marked abandoned and won't count as a completed workout."
        confirmLabel="Discard"
        confirmTone="danger"
        onConfirm={discard}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  )
}
