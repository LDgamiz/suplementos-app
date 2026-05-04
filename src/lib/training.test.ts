import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => {
  const fromMock = vi.fn()
  return { fromMock }
})

vi.mock('../supabaseClient', () => ({
  supabase: { from: h.fromMock },
}))

import {
  startWorkout, setActiveRoutine, getWorkoutFull, finishWorkout,
} from './training'

beforeEach(() => {
  h.fromMock.mockReset()
})

/** Helper that returns a stub row builder with the given resolved values. */
function tableStub(resolves: Record<string, any>) {
  const b: any = {}
  const chain = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'in', 'limit']
  chain.forEach(m => { b[m] = vi.fn().mockReturnValue(b) })
  b.single = vi.fn().mockResolvedValue(resolves.single ?? { data: null, error: null })
  b.maybeSingle = vi.fn().mockResolvedValue(resolves.maybeSingle ?? { data: null, error: null })
  b.then = (cb: any) =>
    Promise.resolve(resolves.then ?? { data: [], error: null }).then(cb)
  return b
}

describe('setActiveRoutine', () => {
  it('deactivates the current active routine and activates the new one', async () => {
    const tables: any[] = []
    h.fromMock.mockImplementation(() => {
      const t = tableStub({ then: { data: null, error: null } })
      tables.push(t)
      return t
    })

    await setActiveRoutine('user-1', 'routine-2')

    expect(h.fromMock).toHaveBeenCalledTimes(2)
    expect(h.fromMock).toHaveBeenNthCalledWith(1, 'routines')
    expect(h.fromMock).toHaveBeenNthCalledWith(2, 'routines')
    expect(tables[0].update).toHaveBeenCalledWith({ is_active: false })
    expect(tables[1].update).toHaveBeenCalledWith({ is_active: true })
    expect(tables[1].eq).toHaveBeenCalledWith('id', 'routine-2')
  })
})

describe('startWorkout', () => {
  it('clones the routine day into a workout with snapshot exercises and seed sets', async () => {
    const dayRow = { id: 'day-1', name: 'Push', routine_id: 'routine-1' }
    const exercisesData = [
      { id: 'ex-1', routine_day_id: 'day-1', user_id: 'user-1', name: 'Bench', sets: 3, rep_range: '8-10', order_index: 0, notes: null, created_at: 't' },
      { id: 'ex-2', routine_day_id: 'day-1', user_id: 'user-1', name: 'Incline', sets: 2, rep_range: '10-12', order_index: 1, notes: null, created_at: 't' },
    ]
    const workoutCreated = { id: 'workout-9' }
    const wxCreated = [
      { id: 'wx-1', routine_exercise_id: 'ex-1' },
      { id: 'wx-2', routine_exercise_id: 'ex-2' },
    ]

    const callsByTable: Record<string, any[]> = {}
    h.fromMock.mockImplementation((table: string) => {
      const list = (callsByTable[table] = callsByTable[table] ?? [])
      let stub: any
      if (table === 'routine_days') {
        stub = tableStub({ single: { data: dayRow, error: null } })
      } else if (table === 'routine_exercises') {
        stub = tableStub({ then: { data: exercisesData, error: null } })
      } else if (table === 'workouts') {
        stub = tableStub({ single: { data: workoutCreated, error: null } })
      } else if (table === 'workout_exercises') {
        // Behave like .insert(...).select(...) returning the created rows.
        stub = tableStub({ then: { data: wxCreated, error: null } })
      } else if (table === 'workout_sets') {
        stub = tableStub({ then: { data: null, error: null } })
      } else {
        stub = tableStub({})
      }
      list.push(stub)
      return stub
    })

    const { workoutId } = await startWorkout('user-1', 'day-1')

    expect(workoutId).toBe('workout-9')
    // 1 read of the day, 1 read of exercises, 1 insert workout, 1 insert wx, 1 insert sets
    expect(h.fromMock).toHaveBeenCalledWith('routine_days')
    expect(h.fromMock).toHaveBeenCalledWith('routine_exercises')
    expect(h.fromMock).toHaveBeenCalledWith('workouts')
    expect(h.fromMock).toHaveBeenCalledWith('workout_exercises')
    expect(h.fromMock).toHaveBeenCalledWith('workout_sets')

    // Workout insert payload uses the day's snapshot.
    const workoutsStub = callsByTable['workouts'][0]
    expect(workoutsStub.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      routine_id: 'routine-1',
      routine_day_name: 'Push',
      status: 'in_progress',
    }))

    // workout_exercises payload mirrors the planned exercises.
    const wxStub = callsByTable['workout_exercises'][0]
    const wxInserted = wxStub.insert.mock.calls[0][0]
    expect(wxInserted).toHaveLength(2)
    expect(wxInserted[0]).toMatchObject({ name: 'Bench', rep_range: '8-10', routine_exercise_id: 'ex-1' })

    // workout_sets seeds 3 + 2 rows.
    const setsStub = callsByTable['workout_sets'][0]
    const setsInserted = setsStub.insert.mock.calls[0][0]
    expect(setsInserted).toHaveLength(5)
    expect(setsInserted.filter((r: any) => r.workout_exercise_id === 'wx-1')).toHaveLength(3)
    expect(setsInserted.filter((r: any) => r.workout_exercise_id === 'wx-2')).toHaveLength(2)
    expect(setsInserted.every((r: any) => r.completed === false)).toBe(true)
  })

  it('throws when the day has no exercises planned', async () => {
    h.fromMock.mockImplementation((table: string) => {
      if (table === 'routine_days') return tableStub({ single: { data: { id: 'day-1', name: 'Rest', routine_id: 'r' }, error: null } })
      if (table === 'routine_exercises') return tableStub({ then: { data: [], error: null } })
      return tableStub({})
    })

    await expect(startWorkout('user-1', 'day-1')).rejects.toThrow(/no exercises/i)
  })
})

describe('getWorkoutFull', () => {
  it('assembles workout + exercises + sets', async () => {
    h.fromMock.mockImplementation((table: string) => {
      if (table === 'workouts') return tableStub({ maybeSingle: { data: { id: 'w1', user_id: 'u1', status: 'in_progress' }, error: null } })
      if (table === 'workout_exercises') return tableStub({ then: { data: [{ id: 'wx1', workout_id: 'w1' }], error: null } })
      if (table === 'workout_sets') return tableStub({ then: { data: [{ id: 's1', workout_exercise_id: 'wx1', set_number: 1 }], error: null } })
      return tableStub({})
    })

    const full = await getWorkoutFull('w1')
    expect(full?.workout.id).toBe('w1')
    expect(full?.exercises).toHaveLength(1)
    expect(full?.sets).toHaveLength(1)
  })

  it('returns null when workout does not exist', async () => {
    h.fromMock.mockImplementation(() => tableStub({ maybeSingle: { data: null, error: null } }))
    expect(await getWorkoutFull('missing')).toBeNull()
  })
})

describe('finishWorkout', () => {
  it('updates status to completed and sets finished_at', async () => {
    const stub = tableStub({ then: { data: null, error: null } })
    h.fromMock.mockImplementation(() => stub)

    await finishWorkout('w1')

    const patch = stub.update.mock.calls[0][0]
    expect(patch.status).toBe('completed')
    expect(typeof patch.finished_at).toBe('string')
    expect(stub.eq).toHaveBeenCalledWith('id', 'w1')
  })
})
