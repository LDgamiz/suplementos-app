import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { MealsByDay, getWeekMeals } from '../lib/diet'

export interface DietWeekData {
  mealsByDay: MealsByDay
  loading: boolean
  /** Set when the week could not be read (e.g. the migration hasn't been run). */
  loadError: string | null
  refresh: () => Promise<void>
}

/**
 * Loads the user's whole week (max 35 rows) in one round trip so switching
 * days in the week rail never hits the network.
 */
export function useDietWeek(session: Session | null): DietWeekData {
  const [mealsByDay, setMealsByDay] = useState<MealsByDay>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!session) { setMealsByDay({}); setLoading(false); return }
    setLoading(true)
    setLoadError(null)
    try {
      setMealsByDay(await getWeekMeals(session.user.id))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load your week')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { refresh() }, [refresh])

  return { mealsByDay, loading, loadError, refresh }
}
