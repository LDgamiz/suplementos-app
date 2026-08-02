import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => {
  const fromMock = vi.fn()
  return { fromMock }
})

vi.mock('../supabaseClient', () => ({
  supabase: { from: h.fromMock },
}))

import {
  MEAL_SLOTS, WEEK_ORDER, slotLabel,
  parseIngredients, formatIngredients, sumMacros, kcal,
  upsertMeal, copyDay, getWeekMeals, saveMealReminder,
  DietMeal,
} from './diet'
import { ValidationError } from './validation'

beforeEach(() => {
  h.fromMock.mockReset()
})

/** Stub row builder mirroring the one in training.test.ts. */
function tableStub(resolves: Record<string, any> = {}) {
  const b: any = {}
  const chain = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'in']
  chain.forEach(m => { b[m] = vi.fn().mockReturnValue(b) })
  b.single = vi.fn().mockResolvedValue(resolves.single ?? { data: null, error: null })
  b.maybeSingle = vi.fn().mockResolvedValue(resolves.maybeSingle ?? { data: null, error: null })
  b.then = (cb: any) => Promise.resolve(resolves.then ?? { data: [], error: null }).then(cb)
  return b
}

function makeMeal(over: Partial<DietMeal> = {}): DietMeal {
  return {
    id: 'meal-1',
    user_id: 'user-1',
    day_of_week: 1,
    slot: 'breakfast',
    title: 'Oats with protein',
    ingredients: ['60g oats', '1 scoop whey'],
    protein_g: 38,
    fat_g: 12,
    carbs_g: 55,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...over,
  }
}

// ---------- constants -------------------------------------------------------

describe('meal slot constants', () => {
  it('defines the five slots in eating order', () => {
    expect(MEAL_SLOTS.map(s => s.key)).toEqual(
      ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner']
    )
  })

  it('orders the week Monday first over the 0=Sunday storage convention', () => {
    expect(WEEK_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('resolves a human label for a slot key', () => {
    expect(slotLabel('snack1')).toBe('Snack 1')
    expect(slotLabel('dinner')).toBe('Dinner')
  })
})

// ---------- parseIngredients ------------------------------------------------

describe('parseIngredients', () => {
  it('splits on newlines and trims each line', () => {
    expect(parseIngredients('60g oats\n  1 scoop whey  \n1 banana'))
      .toEqual(['60g oats', '1 scoop whey', '1 banana'])
  })

  it('drops blank lines', () => {
    expect(parseIngredients('a\n\n\n   \nb')).toEqual(['a', 'b'])
  })

  it('returns an empty array for empty or whitespace input', () => {
    expect(parseIngredients('')).toEqual([])
    expect(parseIngredients('   \n  ')).toEqual([])
  })

  it('handles CRLF line endings', () => {
    expect(parseIngredients('a\r\nb')).toEqual(['a', 'b'])
  })

  it('truncates a line longer than the ingredient limit', () => {
    const long = 'x'.repeat(200)
    const [only] = parseIngredients(long)
    expect(only).toHaveLength(100)
  })

  it('caps the number of ingredients', () => {
    const many = Array.from({ length: 50 }, (_, i) => `item ${i}`).join('\n')
    expect(parseIngredients(many)).toHaveLength(30)
  })
})

describe('formatIngredients', () => {
  it('joins the list back into one line per ingredient', () => {
    expect(formatIngredients(['a', 'b', 'c'])).toBe('a\nb\nc')
  })

  it('returns an empty string for an empty list', () => {
    expect(formatIngredients([])).toBe('')
  })

  it('round-trips through parseIngredients', () => {
    const list = ['60g oats', '1 scoop whey', '1 banana']
    expect(parseIngredients(formatIngredients(list))).toEqual(list)
  })
})

// ---------- macros ----------------------------------------------------------

describe('sumMacros', () => {
  it('adds up protein, fat and carbs across meals', () => {
    const meals = [
      makeMeal({ protein_g: 38, fat_g: 12, carbs_g: 55 }),
      makeMeal({ id: 'meal-2', slot: 'lunch', protein_g: 50, fat_g: 20, carbs_g: 60 }),
    ]
    expect(sumMacros(meals)).toEqual({ protein: 88, fat: 32, carbs: 115 })
  })

  it('returns zeros for no meals', () => {
    expect(sumMacros([])).toEqual({ protein: 0, fat: 0, carbs: 0 })
  })
})

describe('kcal', () => {
  it('applies 4/9/4 per gram', () => {
    expect(kcal({ protein: 100, fat: 50, carbs: 200 })).toBe(100 * 4 + 50 * 9 + 200 * 4)
  })

  it('rounds to a whole number', () => {
    expect(kcal({ protein: 10.5, fat: 0, carbs: 0 })).toBe(42)
  })

  it('is zero for an empty day', () => {
    expect(kcal({ protein: 0, fat: 0, carbs: 0 })).toBe(0)
  })
})

// ---------- upsertMeal ------------------------------------------------------

describe('upsertMeal', () => {
  it('upserts on the (user, day, slot) conflict target', async () => {
    const t = tableStub({ single: { data: makeMeal(), error: null } })
    h.fromMock.mockReturnValue(t)

    await upsertMeal('user-1', 1, 'breakfast', {
      title: 'Oats with protein',
      ingredientsText: '60g oats\n1 scoop whey',
      protein: 38, fat: 12, carbs: 55,
    })

    expect(h.fromMock).toHaveBeenCalledWith('diet_meals')
    expect(t.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        day_of_week: 1,
        slot: 'breakfast',
        title: 'Oats with protein',
        ingredients: ['60g oats', '1 scoop whey'],
        protein_g: 38, fat_g: 12, carbs_g: 55,
      }),
      { onConflict: 'user_id,day_of_week,slot' }
    )
  })

  it('rejects an empty title', async () => {
    h.fromMock.mockReturnValue(tableStub())
    await expect(upsertMeal('user-1', 1, 'breakfast', {
      title: '   ', ingredientsText: '', protein: 0, fat: 0, carbs: 0,
    })).rejects.toBeInstanceOf(ValidationError)
    expect(h.fromMock).not.toHaveBeenCalled()
  })

  it('rejects a negative macro', async () => {
    h.fromMock.mockReturnValue(tableStub())
    await expect(upsertMeal('user-1', 1, 'breakfast', {
      title: 'Oats', ingredientsText: '', protein: -5, fat: 0, carbs: 0,
    })).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects a day_of_week outside 0-6', async () => {
    h.fromMock.mockReturnValue(tableStub())
    await expect(upsertMeal('user-1', 9, 'breakfast', {
      title: 'Oats', ingredientsText: '', protein: 0, fat: 0, carbs: 0,
    })).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects an unknown slot', async () => {
    h.fromMock.mockReturnValue(tableStub())
    await expect(upsertMeal('user-1', 1, 'brunch' as any, {
      title: 'Oats', ingredientsText: '', protein: 0, fat: 0, carbs: 0,
    })).rejects.toBeInstanceOf(ValidationError)
  })
})

// ---------- getWeekMeals ----------------------------------------------------

describe('getWeekMeals', () => {
  it('groups the week by day_of_week', async () => {
    h.fromMock.mockReturnValue(tableStub({
      then: {
        data: [
          makeMeal({ id: 'a', day_of_week: 1, slot: 'breakfast' }),
          makeMeal({ id: 'b', day_of_week: 1, slot: 'lunch' }),
          makeMeal({ id: 'c', day_of_week: 3, slot: 'dinner' }),
        ],
        error: null,
      },
    }))

    const byDay = await getWeekMeals('user-1')

    expect(Object.keys(byDay).sort()).toEqual(['1', '3'])
    expect(byDay[1].map(m => m.id)).toEqual(['a', 'b'])
    expect(byDay[3].map(m => m.id)).toEqual(['c'])
  })

  it('returns an empty map when the user has no plan yet', async () => {
    h.fromMock.mockReturnValue(tableStub({ then: { data: [], error: null } }))
    expect(await getWeekMeals('user-1')).toEqual({})
  })
})

// ---------- copyDay ---------------------------------------------------------

describe('copyDay', () => {
  it('clones every source meal onto each target day in one upsert', async () => {
    const read = tableStub({
      then: {
        data: [
          makeMeal({ id: 'a', day_of_week: 1, slot: 'breakfast' }),
          makeMeal({ id: 'b', day_of_week: 1, slot: 'lunch', title: 'Chicken and rice' }),
        ],
        error: null,
      },
    })
    const write = tableStub({ then: { data: null, error: null } })
    h.fromMock.mockReturnValueOnce(read).mockReturnValueOnce(write)

    await copyDay('user-1', 1, [2, 3])

    const rows = write.upsert.mock.calls[0][0]
    expect(rows).toHaveLength(4)
    expect(rows.map((r: any) => r.day_of_week).sort()).toEqual([2, 2, 3, 3])
    // clones must not carry the source row id
    expect(rows.every((r: any) => r.id === undefined)).toBe(true)
    expect(rows.find((r: any) => r.day_of_week === 3 && r.slot === 'lunch').title)
      .toBe('Chicken and rice')
    expect(write.upsert.mock.calls[0][1]).toEqual({ onConflict: 'user_id,day_of_week,slot' })
  })

  it('does nothing when the source day is empty', async () => {
    h.fromMock.mockReturnValueOnce(tableStub({ then: { data: [], error: null } }))
    await copyDay('user-1', 1, [2])
    expect(h.fromMock).toHaveBeenCalledTimes(1)
  })

  it('does nothing when no target day is selected', async () => {
    await copyDay('user-1', 1, [])
    expect(h.fromMock).not.toHaveBeenCalled()
  })

  it('refuses to copy a day onto itself', async () => {
    await expect(copyDay('user-1', 1, [1, 2])).rejects.toBeInstanceOf(ValidationError)
  })
})

// ---------- reminders -------------------------------------------------------

describe('saveMealReminder', () => {
  it('upserts on (user, slot) with the caller timezone', async () => {
    const t = tableStub({ then: { data: null, error: null } })
    h.fromMock.mockReturnValue(t)

    await saveMealReminder('user-1', 'lunch', '14:00', true, 'America/Mexico_City')

    expect(h.fromMock).toHaveBeenCalledWith('meal_reminders')
    expect(t.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        slot: 'lunch',
        hora: '14:00',
        activa: true,
        timezone: 'America/Mexico_City',
      },
      { onConflict: 'user_id,slot' }
    )
  })

  it('rejects a malformed time', async () => {
    h.fromMock.mockReturnValue(tableStub())
    await expect(saveMealReminder('user-1', 'lunch', '25:99', true, 'UTC'))
      .rejects.toBeInstanceOf(ValidationError)
    await expect(saveMealReminder('user-1', 'lunch', 'noon', true, 'UTC'))
      .rejects.toBeInstanceOf(ValidationError)
  })
})
