import { supabase } from '../supabaseClient'
import { LIMITS, requireString, optionalString, boundedNumber } from './validation'

// ---------- Types -----------------------------------------------------------

export interface Routine {
  id: string
  user_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoutineDay {
  id: string
  routine_id: string
  user_id: string
  day_of_week: number // 0 = Sunday … 6 = Saturday
  name: string | null
  created_at: string
}

export interface RoutineExercise {
  id: string
  routine_day_id: string
  user_id: string
  name: string
  sets: number
  rep_range: string | null
  order_index: number
  notes: string | null
  created_at: string
}

export type WorkoutStatus = 'in_progress' | 'completed' | 'abandoned'

export interface Workout {
  id: string
  user_id: string
  routine_id: string | null
  routine_day_name: string | null
  fecha: string
  status: WorkoutStatus
  started_at: string
  finished_at: string | null
  notes: string | null
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  user_id: string
  routine_exercise_id: string | null
  name: string
  rep_range: string | null
  order_index: number
  created_at: string
}

export interface WorkoutSet {
  id: string
  workout_exercise_id: string
  user_id: string
  set_number: number
  reps: number | null
  weight: number | null
  completed: boolean
  created_at: string
  updated_at: string
}

export interface WorkoutFull {
  workout: Workout
  exercises: WorkoutExercise[]
  sets: WorkoutSet[]
}

// ---------- Routines --------------------------------------------------------

export async function listRoutines(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Routine[]
}

export async function getActiveRoutine(userId: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return (data as Routine | null) ?? null
}

export async function createRoutine(userId: string, name: string): Promise<Routine> {
  const cleanName = requireString(name, LIMITS.routineName.min, LIMITS.routineName.max, 'Routine name')
  const { data, error } = await supabase
    .from('routines')
    .insert({ user_id: userId, name: cleanName, is_active: false })
    .select('*')
    .single()
  if (error) throw error
  return data as Routine
}

export async function renameRoutine(id: string, name: string): Promise<void> {
  const cleanName = requireString(name, LIMITS.routineName.min, LIMITS.routineName.max, 'Routine name')
  const { error } = await supabase.from('routines').update({ name: cleanName }).eq('id', id)
  if (error) throw error
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', id)
  if (error) throw error
}

/** Sets the given routine as the user's active one (deactivates any other). */
export async function setActiveRoutine(userId: string, routineId: string): Promise<void> {
  // The partial unique index forbids two active routines per user, so we
  // deactivate first and then activate. Two updates, one transaction's worth
  // of work — Supabase doesn't expose explicit transactions to the client,
  // but the partial unique acts as a guardrail if anything goes wrong.
  const { error: deactErr } = await supabase
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
  if (deactErr) throw deactErr
  const { error: actErr } = await supabase
    .from('routines')
    .update({ is_active: true })
    .eq('id', routineId)
  if (actErr) throw actErr
}

// ---------- Routine days + exercises ---------------------------------------

export async function listRoutineDays(routineId: string): Promise<RoutineDay[]> {
  const { data, error } = await supabase
    .from('routine_days')
    .select('*')
    .eq('routine_id', routineId)
    .order('day_of_week')
  if (error) throw error
  return (data ?? []) as RoutineDay[]
}

export async function upsertRoutineDay(
  userId: string, routineId: string, dayOfWeek: number, name: string | null
): Promise<RoutineDay> {
  if (dayOfWeek < 0 || dayOfWeek > 6) throw new Error('day_of_week must be 0-6')
  const cleanName = optionalString(name, LIMITS.routineDayName.max)
  const { data, error } = await supabase
    .from('routine_days')
    .upsert(
      { user_id: userId, routine_id: routineId, day_of_week: dayOfWeek, name: cleanName },
      { onConflict: 'routine_id,day_of_week' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data as RoutineDay
}

export async function deleteRoutineDay(id: string): Promise<void> {
  const { error } = await supabase.from('routine_days').delete().eq('id', id)
  if (error) throw error
}

export async function listRoutineExercises(dayId: string): Promise<RoutineExercise[]> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('*')
    .eq('routine_day_id', dayId)
    .order('order_index')
  if (error) throw error
  return (data ?? []) as RoutineExercise[]
}

export async function listRoutineExercisesForRoutine(routineId: string): Promise<RoutineExercise[]> {
  // Join via routine_days
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('*, routine_days!inner(routine_id)')
    .eq('routine_days.routine_id', routineId)
    .order('order_index')
  if (error) throw error
  return ((data ?? []) as unknown as RoutineExercise[])
}

export async function addRoutineExercise(input: {
  userId: string
  routineDayId: string
  name: string
  sets: number
  rep_range?: string | null
  order_index?: number
  notes?: string | null
}): Promise<RoutineExercise> {
  const cleanName = requireString(input.name, LIMITS.exerciseName.min, LIMITS.exerciseName.max, 'Exercise name')
  const cleanSets = boundedNumber(input.sets, LIMITS.exerciseSets.min, LIMITS.exerciseSets.max, 'Sets')
  const cleanRepRange = optionalString(input.rep_range, LIMITS.repRange.max)
  const cleanNotes = optionalString(input.notes, LIMITS.notes.max)
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({
      user_id: input.userId,
      routine_day_id: input.routineDayId,
      name: cleanName,
      sets: cleanSets,
      rep_range: cleanRepRange,
      order_index: input.order_index ?? 0,
      notes: cleanNotes,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as RoutineExercise
}

export async function updateRoutineExercise(
  id: string,
  patch: Partial<Pick<RoutineExercise, 'name' | 'sets' | 'rep_range' | 'order_index' | 'notes'>>
): Promise<void> {
  const validated: typeof patch = { ...patch }
  if (patch.name !== undefined) {
    validated.name = requireString(patch.name, LIMITS.exerciseName.min, LIMITS.exerciseName.max, 'Exercise name')
  }
  if (patch.sets !== undefined) {
    validated.sets = boundedNumber(patch.sets, LIMITS.exerciseSets.min, LIMITS.exerciseSets.max, 'Sets')
  }
  if (patch.rep_range !== undefined) {
    validated.rep_range = optionalString(patch.rep_range, LIMITS.repRange.max)
  }
  if (patch.notes !== undefined) {
    validated.notes = optionalString(patch.notes, LIMITS.notes.max)
  }
  const { error } = await supabase.from('routine_exercises').update(validated).eq('id', id)
  if (error) throw error
}

export async function deleteRoutineExercise(id: string): Promise<void> {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', id)
  if (error) throw error
}

// ---------- Workouts -------------------------------------------------------

/**
 * Starts a workout for the given routine_day:
 *  1. reads the routine exercises planned for that day
 *  2. creates the workout row (status=in_progress)
 *  3. clones each exercise into workout_exercises (snapshot)
 *  4. seeds N empty workout_sets per exercise based on routine sets
 *  5. returns the new workout id and the snapshot it created
 */
export async function startWorkout(
  userId: string,
  routineDayId: string
): Promise<{ workoutId: string }> {
  const { data: dayRow, error: dayErr } = await supabase
    .from('routine_days')
    .select('id, name, routine_id')
    .eq('id', routineDayId)
    .single()
  if (dayErr) throw dayErr

  const exercises = await listRoutineExercises(routineDayId)
  if (exercises.length === 0) throw new Error('This day has no exercises planned.')

  const { data: workoutRow, error: wErr } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      routine_id: dayRow.routine_id,
      routine_day_name: dayRow.name,
      status: 'in_progress',
    })
    .select('id')
    .single()
  if (wErr) throw wErr
  const workoutId = workoutRow.id as string

  const wxRows = exercises.map(ex => ({
    workout_id: workoutId,
    user_id: userId,
    routine_exercise_id: ex.id,
    name: ex.name,
    rep_range: ex.rep_range,
    order_index: ex.order_index,
  }))
  const { data: wxs, error: wxErr } = await supabase
    .from('workout_exercises')
    .insert(wxRows)
    .select('id, routine_exercise_id')
  if (wxErr) throw wxErr

  const setRows: Array<{
    workout_exercise_id: string
    user_id: string
    set_number: number
    completed: boolean
  }> = []
  for (const wx of wxs as Array<{ id: string; routine_exercise_id: string }>) {
    const planned = exercises.find(e => e.id === wx.routine_exercise_id)
    const setsCount = planned?.sets ?? 1
    for (let i = 1; i <= setsCount; i++) {
      setRows.push({
        workout_exercise_id: wx.id,
        user_id: userId,
        set_number: i,
        completed: false,
      })
    }
  }
  if (setRows.length > 0) {
    const { error: setsErr } = await supabase.from('workout_sets').insert(setRows)
    if (setsErr) throw setsErr
  }

  return { workoutId }
}

export async function getWorkoutFull(workoutId: string): Promise<WorkoutFull | null> {
  const { data: workout, error: wErr } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .maybeSingle()
  if (wErr) throw wErr
  if (!workout) return null

  const { data: exercises, error: exErr } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', workoutId)
    .order('order_index')
  if (exErr) throw exErr

  const exerciseIds = (exercises ?? []).map(e => e.id)
  let sets: WorkoutSet[] = []
  if (exerciseIds.length > 0) {
    const { data: setRows, error: sErr } = await supabase
      .from('workout_sets')
      .select('*')
      .in('workout_exercise_id', exerciseIds)
      .order('set_number')
    if (sErr) throw sErr
    sets = (setRows ?? []) as WorkoutSet[]
  }

  return {
    workout: workout as Workout,
    exercises: (exercises ?? []) as WorkoutExercise[],
    sets,
  }
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'completed'>>
): Promise<void> {
  const validated: typeof patch = { ...patch }
  if (patch.reps !== undefined && patch.reps !== null) {
    validated.reps = boundedNumber(patch.reps, LIMITS.exerciseReps.min, LIMITS.exerciseReps.max, 'Reps')
  }
  if (patch.weight !== undefined && patch.weight !== null) {
    validated.weight = boundedNumber(patch.weight, LIMITS.exerciseWeight.min, LIMITS.exerciseWeight.max, 'Weight')
  }
  const { error } = await supabase.from('workout_sets').update(validated).eq('id', id)
  if (error) throw error
}

export async function finishWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .update({ status: 'completed', finished_at: new Date().toISOString() })
    .eq('id', workoutId)
  if (error) throw error
}

export async function abandonWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .update({ status: 'abandoned', finished_at: new Date().toISOString() })
    .eq('id', workoutId)
  if (error) throw error
}

export async function getInProgressWorkout(userId: string): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as Workout | null) ?? null
}

export async function listRecentWorkouts(userId: string, limit = 20): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Workout[]
}
