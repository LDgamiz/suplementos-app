import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithLayoutCtx } from '../../test/utils'
import { makeSession, makePerfil } from '../../test/mocks/supabase'
import type { DietMeal, MealsByDay } from '../../lib/diet'

const h = vi.hoisted(() => ({
  getWeekMeals: vi.fn(),
  getMealReminders: vi.fn(),
  upsertMeal: vi.fn(),
  deleteMeal: vi.fn(),
  copyDay: vi.fn(),
}))

vi.mock('../../lib/diet', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/diet')>()
  return {
    ...actual,
    getWeekMeals: h.getWeekMeals,
    getMealReminders: h.getMealReminders,
    upsertMeal: h.upsertMeal,
    deleteMeal: h.deleteMeal,
    copyDay: h.copyDay,
  }
})

import Diet from './Diet'

const session = makeSession()
const ctx = { session, perfil: makePerfil(), isAdmin: false }

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

/** Pins "today" so day-dependent assertions are stable. Monday = day 1. */
function pinToMonday() {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-03T09:00:00'))
}

function renderDiet(mealsByDay: MealsByDay = {}) {
  h.getWeekMeals.mockResolvedValue(mealsByDay)
  h.getMealReminders.mockResolvedValue([])
  return renderWithLayoutCtx(<Diet />, ctx, { route: '/diet' })
}

beforeEach(() => {
  vi.useRealTimers()
  h.getWeekMeals.mockReset()
  h.getMealReminders.mockReset()
  h.upsertMeal.mockReset().mockResolvedValue(makeMeal())
  h.deleteMeal.mockReset().mockResolvedValue(undefined)
  h.copyDay.mockReset().mockResolvedValue(undefined)
})

describe('Diet', () => {
  it('preselects today in the week rail', async () => {
    pinToMonday()
    renderDiet()
    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Monday' })).toHaveAttribute('aria-selected', 'true')
    })
    expect(screen.getByRole('tab', { name: 'Tuesday' })).toHaveAttribute('aria-selected', 'false')
  })

  it('offers an add action for every empty slot', async () => {
    renderDiet()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add breakfast/i })).toBeInTheDocument()
    })
    for (const label of ['snack 1', 'lunch', 'snack 2', 'dinner']) {
      expect(screen.getByRole('button', { name: new RegExp(`add ${label}`, 'i') })).toBeInTheDocument()
    }
    expect(screen.getByText('0/5 meals planned')).toBeInTheDocument()
  })

  it('renders a planned meal with its ingredients and macros', async () => {
    pinToMonday()
    renderDiet({ 1: [makeMeal()] })
    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByText('Oats with protein')).toBeInTheDocument()
    })
    expect(screen.getByText('60g oats · 1 scoop whey')).toBeInTheDocument()
    expect(screen.getByText('1/5 meals planned')).toBeInTheDocument()
  })

  it('sums the day macros into a kcal total', async () => {
    pinToMonday()
    renderDiet({
      1: [
        makeMeal({ protein_g: 40, fat_g: 10, carbs_g: 50 }),
        makeMeal({ id: 'm2', slot: 'lunch', title: 'Chicken and rice', protein_g: 60, fat_g: 20, carbs_g: 80 }),
      ],
    })
    vi.useRealTimers()

    // (100*4) + (30*9) + (130*4) = 400 + 270 + 520 = 1190
    await waitFor(() => {
      expect(screen.getByText('1,190')).toBeInTheDocument()
    })
    expect(screen.getByText('100g')).toBeInTheDocument()  // protein
    expect(screen.getByText('30g')).toBeInTheDocument()   // fat
    expect(screen.getByText('130g')).toBeInTheDocument()  // carbs
  })

  it('shows the empty state again after switching to a day with no plan', async () => {
    pinToMonday()
    renderDiet({ 1: [makeMeal()] })
    vi.useRealTimers()
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByText('Oats with protein')).toBeInTheDocument())
    await user.click(screen.getByRole('tab', { name: 'Thursday' }))

    expect(screen.queryByText('Oats with protein')).not.toBeInTheDocument()
    expect(screen.getByText('0/5 meals planned')).toBeInTheDocument()
  })

  it('saves a new meal into the selected day and slot', async () => {
    pinToMonday()
    renderDiet()
    vi.useRealTimers()
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByRole('button', { name: /add lunch/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /add lunch/i }))

    await user.type(screen.getByLabelText(/what are you eating/i), 'Chicken and rice')
    await user.type(screen.getByLabelText(/ingredients/i), '200g chicken\n150g rice')
    await user.type(screen.getByLabelText(/protein/i), '60')

    await user.click(screen.getByRole('button', { name: /save meal/i }))

    await waitFor(() => {
      expect(h.upsertMeal).toHaveBeenCalledWith('user-1', 1, 'lunch', {
        title: 'Chicken and rice',
        ingredientsText: '200g chicken\n150g rice',
        protein: '60',
        fat: 0,
        carbs: 0,
      })
    })
  })

  it('only offers copy day once the day has meals', async () => {
    pinToMonday()
    const { unmount } = renderDiet()
    vi.useRealTimers()
    await waitFor(() => expect(screen.getByText('0/5 meals planned')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /copy .* to other days/i })).not.toBeInTheDocument()
    unmount()

    pinToMonday()
    renderDiet({ 1: [makeMeal()] })
    vi.useRealTimers()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy monday to other days/i })).toBeInTheDocument()
    })
  })

  it('copies the day to the picked targets after confirming', async () => {
    pinToMonday()
    renderDiet({ 1: [makeMeal()] })
    vi.useRealTimers()
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByRole('button', { name: /copy monday to other days/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /copy monday to other days/i }))

    await user.click(screen.getByRole('button', { name: 'Tue' }))
    await user.click(screen.getByRole('button', { name: 'Wed' }))
    await user.click(screen.getByRole('button', { name: /copy to 2 days/i }))

    // ConfirmModal guards the overwrite
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^copy$/i }))

    await waitFor(() => {
      expect(h.copyDay).toHaveBeenCalledWith('user-1', 1, [2, 3])
    })
  })
})
