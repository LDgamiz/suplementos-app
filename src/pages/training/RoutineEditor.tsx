import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useLayoutCtx } from '../../layout/context'
import { useActiveRoutine } from '../../hooks/useActiveRoutine'
import ConfirmModal from '../../components/ConfirmModal'
import {
  RoutineDay, RoutineExercise,
  renameRoutine, deleteRoutine, upsertRoutineDay,
  addRoutineExercise, updateRoutineExercise, deleteRoutineExercise,
} from '../../lib/training'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const // Mon → Sun

const inputClass =
  'w-full px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-sm'

export default function RoutineEditor() {
  const { session } = useLayoutCtx()
  const { routine, days, exercisesByDay, loading, refresh } = useActiveRoutine(session)

  const [renaming, setRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!loading && !routine) return <Navigate to="/training" replace />

  async function handleRename() {
    if (!routine) return
    const name = renameDraft.trim()
    if (!name || name === routine.name) { setRenaming(false); return }
    setBusy(true)
    try {
      await renameRoutine(routine.id, name)
      await refresh()
    } finally {
      setBusy(false)
      setRenaming(false)
    }
  }

  async function handleDeleteRoutine() {
    if (!routine) return
    setDeleteOpen(false)
    setBusy(true)
    try {
      await deleteRoutine(routine.id)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Link to="/training" aria-label="Back to Training" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Routine</h1>
      </div>

      {loading && <p className="text-sm text-slate-500 text-center py-10">Loading...</p>}

      {!loading && routine && (
        <>
          <div className="bg-surface border border-white/[0.08] rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2">
              {renaming ? (
                <>
                  <input
                    value={renameDraft}
                    onChange={e => setRenameDraft(e.target.value)}
                    autoFocus
                    className={inputClass}
                  />
                  <button onClick={handleRename} disabled={busy} aria-label="Save name" className="p-1.5 rounded-lg text-brand hover:bg-brand/10 transition">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setRenaming(false)} aria-label="Cancel rename" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/[0.05] transition">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-slate-100 truncate flex-1">{routine.name}</h2>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                    Active
                  </span>
                  <button
                    onClick={() => { setRenameDraft(routine.name); setRenaming(true) }}
                    aria-label="Rename routine"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Delete routine"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {DISPLAY_ORDER.map(dow => (
              <DaySection
                key={dow}
                userId={session.user.id}
                routineId={routine.id}
                dayOfWeek={dow}
                day={days.find(d => d.day_of_week === dow) ?? null}
                exercises={(days.find(d => d.day_of_week === dow)
                  ? (exercisesByDay[days.find(d => d.day_of_week === dow)!.id] ?? [])
                  : [])}
                onChange={refresh}
              />
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="Delete this routine?"
        body="All days, exercises, and the routine itself will be deleted. Past workouts stay in history."
        confirmLabel="Delete"
        confirmTone="danger"
        onConfirm={handleDeleteRoutine}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}

// ---------- Day section ----------------------------------------------------

interface DaySectionProps {
  userId: string
  routineId: string
  dayOfWeek: number
  day: RoutineDay | null
  exercises: RoutineExercise[]
  onChange: () => Promise<void>
}

function DaySection({ userId, routineId, dayOfWeek, day, exercises, onChange }: DaySectionProps) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const [adding, setAdding] = useState(false)

  async function saveLabel() {
    const value = labelDraft.trim() || null
    await upsertRoutineDay(userId, routineId, dayOfWeek, value)
    setEditingLabel(false)
    await onChange()
  }

  return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
          {DAY_NAMES[dayOfWeek]}
        </p>
        {editingLabel ? (
          <>
            <input
              value={labelDraft}
              onChange={e => setLabelDraft(e.target.value)}
              placeholder="Label (e.g. Push)"
              autoFocus
              className={`${inputClass} flex-1`}
            />
            <button onClick={saveLabel} aria-label="Save label" className="p-1 rounded-lg text-brand hover:bg-brand/10 transition">
              <Check size={14} />
            </button>
            <button onClick={() => setEditingLabel(false)} aria-label="Cancel" className="p-1 rounded-lg text-slate-400 hover:bg-white/[0.05] transition">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-slate-200 flex-1">
              {day?.name ? `· ${day.name}` : (exercises.length === 0 ? '· Rest' : '')}
            </span>
            <button
              onClick={() => { setLabelDraft(day?.name ?? ''); setEditingLabel(true) }}
              aria-label={`Edit label for ${DAY_NAMES[dayOfWeek]}`}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition">
              <Pencil size={12} />
            </button>
          </>
        )}
      </div>

      {exercises.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {exercises.map(ex => (
            <ExerciseRow key={ex.id} exercise={ex} onChange={onChange} />
          ))}
        </ul>
      )}

      {adding ? (
        <AddExerciseForm
          userId={userId}
          routineId={routineId}
          dayOfWeek={dayOfWeek}
          existingDay={day}
          orderIndex={exercises.length}
          onCancel={() => setAdding(false)}
          onSaved={async () => { setAdding(false); await onChange() }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-2 border border-dashed border-white/10 text-slate-400 hover:text-brand hover:border-brand/30 transition text-xs font-medium">
          <Plus size={13} />
          Add exercise
        </button>
      )}
    </div>
  )
}

// ---------- Exercise row ---------------------------------------------------

function ExerciseRow({ exercise, onChange }: { exercise: RoutineExercise; onChange: () => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [sets, setSets] = useState(String(exercise.sets))
  const [repRange, setRepRange] = useState(exercise.rep_range ?? '')

  async function save() {
    const setsNum = parseInt(sets, 10)
    if (!name.trim() || !setsNum || setsNum < 1 || setsNum > 20) return
    await updateRoutineExercise(exercise.id, {
      name: name.trim(),
      sets: setsNum,
      rep_range: repRange.trim() || null,
    })
    setEditing(false)
    await onChange()
  }

  async function remove() {
    await deleteRoutineExercise(exercise.id)
    await onChange()
  }

  if (editing) {
    return (
      <li className="p-2 rounded-xl border border-brand/20 bg-brand/[0.04] space-y-2">
        <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Exercise name" />
        <div className="flex gap-2">
          <input
            value={sets}
            onChange={e => setSets(e.target.value)}
            type="number" min={1} max={20}
            className={`${inputClass} w-10`}
            placeholder="Sets"
          />
          <input
            value={repRange}
            onChange={e => setRepRange(e.target.value)}
            className={`${inputClass} w-10`}
            placeholder="Rep range (e.g. 8-10)"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs rounded-lg bg-surface-2 border border-white/10 text-slate-400 hover:text-slate-200 transition">
            Cancel
          </button>
          <button onClick={save} className="px-3 py-1 text-xs font-bold rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] transition">
            Save
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-2 border border-white/[0.06]">
      <span className="text-sm text-slate-200 font-medium flex-1 truncate">{exercise.name}</span>
      <span className="text-xs text-slate-500 shrink-0">
        {exercise.sets} × {exercise.rep_range || '—'}
      </span>
      <button
        onClick={() => setEditing(true)}
        aria-label={`Edit ${exercise.name}`}
        className="p-1 rounded-lg text-slate-500 hover:text-brand hover:bg-brand/10 transition">
        <Pencil size={12} />
      </button>
      <button
        onClick={remove}
        aria-label={`Delete ${exercise.name}`}
        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition">
        <Trash2 size={12} />
      </button>
    </li>
  )
}

// ---------- Add exercise form ----------------------------------------------

interface AddExerciseFormProps {
  userId: string
  routineId: string
  dayOfWeek: number
  existingDay: RoutineDay | null
  orderIndex: number
  onCancel: () => void
  onSaved: () => Promise<void>
}

function AddExerciseForm({ userId, routineId, dayOfWeek, existingDay, orderIndex, onCancel, onSaved }: AddExerciseFormProps) {
  const [name, setName] = useState('')
  const [sets, setSets] = useState('3')
  const [repRange, setRepRange] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const setsNum = parseInt(sets, 10)
    if (!name.trim()) { setError('Name required'); return }
    if (!setsNum || setsNum < 1 || setsNum > 20) { setError('Sets must be 1–20'); return }
    setBusy(true)
    setError(null)
    try {
      // Create the routine_day on demand if it doesn't exist yet.
      let dayId = existingDay?.id
      if (!dayId) {
        const created = await upsertRoutineDay(userId, routineId, dayOfWeek, null)
        dayId = created.id
      }
      await addRoutineExercise({
        userId,
        routineDayId: dayId,
        name: name.trim(),
        sets: setsNum,
        rep_range: repRange.trim() || null,
        order_index: orderIndex,
      })
      await onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add exercise')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-3 rounded-xl border border-brand/20 bg-brand/[0.04] space-y-2">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        className={inputClass}
        placeholder="Exercise name"
      />
      <div className="flex gap-2">
        <input
          value={sets}
          onChange={e => setSets(e.target.value)}
          type="number" min={1} max={20}
          className={`${inputClass} w-10`}
          placeholder="Sets"
        />
        <input
          value={repRange}
          onChange={e => setRepRange(e.target.value)}
          className={`${inputClass} w-10`}
          placeholder="Rep range (e.g. 8-10)"
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg bg-surface-2 border border-white/10 text-slate-400 hover:text-slate-200 transition">
          Cancel
        </button>
        <button onClick={save} disabled={busy} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand hover:bg-brand-dark text-[#0A0E1A] transition disabled:opacity-50">
          {busy ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  )
}
