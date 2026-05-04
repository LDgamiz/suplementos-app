import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Routine, RoutineDay, RoutineExercise,
  getActiveRoutine, listRoutineDays, listRoutineExercisesForRoutine,
} from '../lib/training'

export interface ActiveRoutineData {
  routine: Routine | null
  days: RoutineDay[]
  exercisesByDay: Record<string, RoutineExercise[]>
  loading: boolean
  refresh: () => Promise<void>
}

export function useActiveRoutine(session: Session | null): ActiveRoutineData {
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [days, setDays] = useState<RoutineDay[]>([])
  const [exercisesByDay, setExercisesByDay] = useState<Record<string, RoutineExercise[]>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session) { setRoutine(null); setDays([]); setExercisesByDay({}); setLoading(false); return }
    setLoading(true)
    const r = await getActiveRoutine(session.user.id)
    if (!r) {
      setRoutine(null)
      setDays([])
      setExercisesByDay({})
      setLoading(false)
      return
    }
    setRoutine(r)
    const [ds, exs] = await Promise.all([
      listRoutineDays(r.id),
      listRoutineExercisesForRoutine(r.id),
    ])
    setDays(ds)
    const grouped: Record<string, RoutineExercise[]> = {}
    for (const ex of exs) {
      if (!grouped[ex.routine_day_id]) grouped[ex.routine_day_id] = []
      grouped[ex.routine_day_id].push(ex)
    }
    setExercisesByDay(grouped)
    setLoading(false)
  }, [session])

  useEffect(() => { refresh() }, [refresh])

  return { routine, days, exercisesByDay, loading, refresh }
}
