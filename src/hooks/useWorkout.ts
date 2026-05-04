import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Workout, WorkoutExercise, WorkoutSet,
  getWorkoutFull, updateSet as svcUpdateSet,
  finishWorkout as svcFinishWorkout,
  abandonWorkout as svcAbandonWorkout,
} from '../lib/training'

const DEBOUNCE_MS = 800

export type SetPatch = Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'completed'>>

export interface UseWorkoutResult {
  loading: boolean
  workout: Workout | null
  exercises: WorkoutExercise[]
  setsByExercise: Record<string, WorkoutSet[]>
  /**
   * Optimistic local update + debounced persist. If `immediate` is true,
   * the patch is flushed right away (use for the completed checkbox).
   */
  updateSet: (setId: string, patch: SetPatch, opts?: { immediate?: boolean }) => void
  finish: () => Promise<void>
  abandon: () => Promise<void>
  /** Returns true once flushed (used by Finish to wait for autosave). */
  flushPending: () => Promise<void>
}

export function useWorkout(workoutId: string | null): UseWorkoutResult {
  const [loading, setLoading] = useState(true)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [setsByExercise, setSetsByExercise] = useState<Record<string, WorkoutSet[]>>({})

  // Refs for the debouncer. We track a pending patch per setId so that
  // multiple keystrokes coalesce into the latest value.
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pendingPatchRef = useRef<Record<string, SetPatch>>({})

  useEffect(() => {
    let cancelled = false
    if (!workoutId) { setLoading(false); return }
    setLoading(true)
    getWorkoutFull(workoutId).then(full => {
      if (cancelled || !full) return
      setWorkout(full.workout)
      setExercises(full.exercises)
      const grouped: Record<string, WorkoutSet[]> = {}
      for (const s of full.sets) {
        if (!grouped[s.workout_exercise_id]) grouped[s.workout_exercise_id] = []
        grouped[s.workout_exercise_id].push(s)
      }
      // Sets already come ordered by set_number from the service.
      setSetsByExercise(grouped)
      setLoading(false)
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [workoutId])

  const flushSet = useCallback(async (setId: string) => {
    const patch = pendingPatchRef.current[setId]
    if (!patch) return
    delete pendingPatchRef.current[setId]
    const timer = timersRef.current[setId]
    if (timer) { clearTimeout(timer); delete timersRef.current[setId] }
    await svcUpdateSet(setId, patch)
  }, [])

  const flushPending = useCallback(async () => {
    const ids = Object.keys(pendingPatchRef.current)
    await Promise.all(ids.map(flushSet))
  }, [flushSet])

  const updateSet = useCallback<UseWorkoutResult['updateSet']>((setId, patch, opts) => {
    // Optimistic local update
    setSetsByExercise(prev => {
      const out: Record<string, WorkoutSet[]> = {}
      for (const [exId, list] of Object.entries(prev)) {
        out[exId] = list.map(s => s.id === setId ? { ...s, ...patch } : s)
      }
      return out
    })

    // Merge into pending patch
    pendingPatchRef.current[setId] = { ...pendingPatchRef.current[setId], ...patch }

    if (opts?.immediate) {
      // fire and forget; errors surface via Sentry/console
      flushSet(setId).catch(err => console.error('updateSet flush error', err))
      return
    }
    if (timersRef.current[setId]) clearTimeout(timersRef.current[setId])
    timersRef.current[setId] = setTimeout(() => {
      flushSet(setId).catch(err => console.error('updateSet flush error', err))
    }, DEBOUNCE_MS)
  }, [flushSet])

  const finish = useCallback(async () => {
    if (!workoutId) return
    await flushPending()
    await svcFinishWorkout(workoutId)
    setWorkout(prev => prev ? { ...prev, status: 'completed', finished_at: new Date().toISOString() } : prev)
  }, [workoutId, flushPending])

  const abandon = useCallback(async () => {
    if (!workoutId) return
    await flushPending()
    await svcAbandonWorkout(workoutId)
    setWorkout(prev => prev ? { ...prev, status: 'abandoned', finished_at: new Date().toISOString() } : prev)
  }, [workoutId, flushPending])

  // Cleanup timers on unmount, attempting one last flush.
  useEffect(() => {
    return () => {
      const ids = Object.keys(pendingPatchRef.current)
      ids.forEach(id => {
        const timer = timersRef.current[id]
        if (timer) clearTimeout(timer)
        const patch = pendingPatchRef.current[id]
        if (patch) svcUpdateSet(id, patch).catch(() => {/* best-effort */})
      })
    }
  }, [])

  return { loading, workout, exercises, setsByExercise, updateSet, finish, abandon, flushPending }
}
