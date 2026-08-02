import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Apple, Bell, BellOff, Copy, Pencil, Plus } from 'lucide-react'
import { useLayoutCtx } from '../../layout/context'
import { useDietWeek } from '../../hooks/useDietWeek'
import HintButton from '../../components/HintButton'
import ConfirmModal from '../../components/ConfirmModal'
import { Button, Card, Eyebrow } from '../../components/ui'
import MealForm from './MealForm'
import {
  DAY_INITIALS, DAY_NAMES, MEAL_SLOTS, WEEK_ORDER,
  DietMeal, MealInput, MealReminder, MealSlot,
  copyDay, deleteMeal, getMealReminders, kcal, sumMacros, upsertMeal,
} from '../../lib/diet'

export default function Diet() {
  const { session } = useLayoutCtx()
  const { mealsByDay, loading, loadError, refresh } = useDietWeek(session)

  const today = new Date().getDay()
  const [day, setDay] = useState(today)
  const [editing, setEditing] = useState<MealSlot | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reminders, setReminders] = useState<MealReminder[]>([])
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyTargets, setCopyTargets] = useState<number[]>([])
  const [confirmCopy, setConfirmCopy] = useState(false)
  const [deleteSlot, setDeleteSlot] = useState<MealSlot | null>(null)

  useEffect(() => {
    let cancelled = false
    getMealReminders(session.user.id)
      .then(r => { if (!cancelled) setReminders(r) })
      .catch(() => { /* times fall back to defaults */ })
    return () => { cancelled = true }
  }, [session.user.id])

  const dayMeals = useMemo(() => mealsByDay[day] ?? [], [mealsByDay, day])
  const mealBySlot = useMemo(() => {
    const map = {} as Record<MealSlot, DietMeal | undefined>
    for (const m of dayMeals) map[m.slot] = m
    return map
  }, [dayMeals])

  const totals = useMemo(() => sumMacros(dayMeals), [dayMeals])
  const calories = kcal(totals)

  function timeFor(slot: MealSlot): string {
    const r = reminders.find(x => x.slot === slot)
    return r?.hora ?? MEAL_SLOTS.find(s => s.key === slot)!.defaultTime
  }

  function isReminderOn(slot: MealSlot): boolean {
    return reminders.find(x => x.slot === slot)?.activa ?? false
  }

  function selectDay(next: number) {
    setDay(next)
    setEditing(null)
    setCopyOpen(false)
    setCopyTargets([])
    setError(null)
  }

  async function handleSave(slot: MealSlot, input: MealInput) {
    setSaving(true)
    setError(null)
    try {
      await upsertMeal(session.user.id, day, slot, input)
      await refresh()
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this meal')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const meal = deleteSlot ? mealBySlot[deleteSlot] : undefined
    setDeleteSlot(null)
    if (!meal) return
    setError(null)
    try {
      await deleteMeal(meal.id)
      await refresh()
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this meal')
    }
  }

  async function handleCopy() {
    setConfirmCopy(false)
    setSaving(true)
    setError(null)
    try {
      await copyDay(session.user.id, day, copyTargets)
      await refresh()
      setCopyOpen(false)
      setCopyTargets([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not copy this day')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <Apple size={18} className="text-brand" />
        </div>
        <h1 className="font-display text-xl font-bold text-white tracking-tight">Diet</h1>
        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/diet/reminders"
            aria-label="Meal reminders"
            className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-white/[0.04] transition">
            <Bell size={16} />
          </Link>
          <HintButton
            label="Diet hint"
            text="Plan the five meals of each weekday once. The times shown are your push reminders — set them under the bell. Built one day? Copy it across the rest of the week."
          />
        </div>
      </div>

      {/* Week rail — day selector doubling as a plan-completeness readout */}
      <Card padding="sm" className="mb-4">
        <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Day of the week">
          {WEEK_ORDER.map(dow => {
            const selected = dow === day
            const planned = (mealsByDay[dow]?.length ?? 0) > 0
            return (
              <button
                key={dow}
                role="tab"
                aria-selected={selected}
                aria-label={DAY_NAMES[dow]}
                onClick={() => selectDay(dow)}
                className={`flex flex-col items-center gap-1.5 py-2 rounded-xl border transition ${
                  selected
                    ? 'bg-brand/10 text-brand border-brand/20'
                    : 'text-slate-400 border-transparent hover:bg-white/[0.04] hover:text-slate-200'
                }`}>
                <span className="text-xs font-semibold">{DAY_INITIALS[dow]}</span>
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    planned
                      ? selected ? 'bg-brand' : 'bg-brand/50'
                      : 'border border-slate-600'
                  }`}
                />
                {dow === today && (
                  <span className="sr-only">Today</span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {loading && <p className="text-sm text-slate-500 text-center py-10">Loading...</p>}

      {!loading && loadError && (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-rose-400 mb-1">{loadError}</p>
          <p className="text-xs text-slate-500">
            If this is the first run, apply <code>supabase/migrations/diet_schema.sql</code> first.
          </p>
        </Card>
      )}

      {!loading && !loadError && (
        <>
          {/* Day total */}
          <Card padding="lg" className="mb-4">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <Eyebrow>{DAY_NAMES[day]}{day === today ? ' · Today' : ''}</Eyebrow>
              <p className="text-xs text-slate-500 tabular-nums">
                {dayMeals.length}/5 meals planned
              </p>
            </div>
            <p className="font-display text-2xl font-bold text-white tabular-nums mb-3">
              {calories.toLocaleString()}
              <span className="text-slate-600 text-base font-normal"> kcal</span>
            </p>
            <MacroBar totals={totals} />
          </Card>

          {/* Time rail */}
          <ol className="mb-5">
            {MEAL_SLOTS.map((slot, i) => {
              const meal = mealBySlot[slot.key]
              const isEditing = editing === slot.key
              const last = i === MEAL_SLOTS.length - 1
              return (
                <li key={slot.key} className="flex gap-3">
                  {/* rail */}
                  <div className="flex flex-col items-center w-12 shrink-0 pt-0.5">
                    <span className="font-display text-[11px] font-semibold text-slate-400 tabular-nums">
                      {timeFor(slot.key)}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        meal ? 'bg-brand' : 'bg-slate-700'
                      }`}
                    />
                    {!last && <span aria-hidden="true" className="w-px flex-1 bg-white/[0.08] mt-1.5" />}
                  </div>

                  {/* content */}
                  <div className={`flex-1 min-w-0 ${last ? 'pb-0' : 'pb-4'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Eyebrow>{slot.label}</Eyebrow>
                      {!isReminderOn(slot.key) && (
                        <BellOff size={11} className="text-slate-600 shrink-0" aria-label="Reminder off" />
                      )}
                    </div>

                    {isEditing ? (
                      <MealForm
                        slot={slot.key}
                        meal={meal ?? null}
                        saving={saving}
                        onSave={input => handleSave(slot.key, input)}
                        onDelete={() => setDeleteSlot(slot.key)}
                        onCancel={() => { setEditing(null); setError(null) }}
                      />
                    ) : meal ? (
                      <div className="rounded-xl bg-surface border border-white/[0.06] p-3.5">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 min-w-0 text-sm font-semibold text-slate-100">
                            {meal.title}
                          </p>
                          <button
                            onClick={() => setEditing(slot.key)}
                            aria-label={`Edit ${slot.label}`}
                            className="p-1 -m-1 rounded text-slate-500 hover:text-brand transition shrink-0">
                            <Pencil size={14} />
                          </button>
                        </div>
                        {meal.ingredients.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {meal.ingredients.join(' · ')}
                          </p>
                        )}
                        <MacroChips
                          protein={meal.protein_g}
                          fat={meal.fat_g}
                          carbs={meal.carbs_g}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditing(slot.key)}
                        className="w-full flex items-center gap-2 rounded-xl border border-dashed border-white/[0.10] px-3.5 py-3 text-sm text-slate-500 hover:border-brand/30 hover:text-brand transition">
                        <Plus size={15} className="shrink-0" />
                        Add {slot.label.toLowerCase()}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          {error && <p className="text-xs text-rose-400 mb-4 text-center">{error}</p>}

          {/* Copy day */}
          {dayMeals.length > 0 && !copyOpen && (
            <Button variant="secondary" fullWidth onClick={() => setCopyOpen(true)}>
              <Copy size={15} />
              Copy {DAY_NAMES[day]} to other days
            </Button>
          )}

          {copyOpen && (
            <Card padding="lg">
              <p className="text-sm font-semibold text-slate-200 mb-1">
                Copy {DAY_NAMES[day]} to
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Meals already planned on the days you pick get replaced.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {WEEK_ORDER.filter(d => d !== day).map(d => {
                  const on = copyTargets.includes(d)
                  return (
                    <button
                      key={d}
                      aria-pressed={on}
                      onClick={() => setCopyTargets(
                        on ? copyTargets.filter(x => x !== d) : [...copyTargets, d]
                      )}
                      className={`py-2 rounded-xl text-xs font-medium border transition ${
                        on
                          ? 'bg-brand/10 text-brand border-brand/20'
                          : 'bg-surface-2 text-slate-400 border-white/10 hover:text-slate-200'
                      }`}>
                      {DAY_NAMES[d].slice(0, 3)}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => { setCopyOpen(false); setCopyTargets([]) }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setConfirmCopy(true)}
                  disabled={saving || copyTargets.length === 0}>
                  {saving ? 'Copying...' : `Copy to ${copyTargets.length || 0} day${copyTargets.length === 1 ? '' : 's'}`}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmModal
        open={confirmCopy}
        title={`Copy ${DAY_NAMES[day]} to ${copyTargets.length} day${copyTargets.length === 1 ? '' : 's'}?`}
        body="Any meal already planned in those slots is replaced by this day's plan."
        confirmLabel="Copy"
        onConfirm={handleCopy}
        onCancel={() => setConfirmCopy(false)}
      />

      <ConfirmModal
        open={deleteSlot !== null}
        title="Delete this meal?"
        body={`${deleteSlot ? MEAL_SLOTS.find(s => s.key === deleteSlot)?.label : 'The meal'} on ${DAY_NAMES[day]} goes back to empty.`}
        confirmLabel="Delete"
        confirmTone="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteSlot(null)}
      />
    </>
  )
}

// ---------- Macro readouts --------------------------------------------------

const MACROS = [
  { key: 'protein', short: 'P', bar: 'bg-brand', text: 'text-brand' },
  { key: 'fat', short: 'F', bar: 'bg-macro-fat', text: 'text-macro-fat' },
  { key: 'carbs', short: 'C', bar: 'bg-warn', text: 'text-warn' },
] as const

function MacroBar({ totals }: { totals: { protein: number; fat: number; carbs: number } }) {
  const grams = totals.protein + totals.fat + totals.carbs

  return (
    <div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-2 mb-2.5">
        {grams > 0 && MACROS.map(m => (
          <div
            key={m.key}
            className={m.bar}
            style={{ width: `${(totals[m.key] / grams) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {MACROS.map(m => (
          <p key={m.key} className="text-xs text-slate-400">
            <span className={`${m.text} font-semibold`}>{m.short}</span>{' '}
            <span className="tabular-nums text-slate-300">{Math.round(totals[m.key])}g</span>
          </p>
        ))}
      </div>
    </div>
  )
}

function MacroChips({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const values = { protein, fat, carbs }
  if (protein + fat + carbs === 0) return null
  return (
    <div className="flex gap-3 mt-2.5">
      {MACROS.map(m => (
        <span key={m.key} className="text-[11px] text-slate-500">
          <span className={m.text}>{m.short}</span>{' '}
          <span className="tabular-nums text-slate-400">{Math.round(values[m.key])}</span>
        </span>
      ))}
    </div>
  )
}
