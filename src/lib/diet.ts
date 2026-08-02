import { supabase } from '../supabaseClient'
import { LIMITS, requireString, boundedNumber, ValidationError } from './validation'

// ---------- Slots + week ----------------------------------------------------

export const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', defaultTime: '08:00' },
  { key: 'snack1',    label: 'Snack 1',   defaultTime: '11:00' },
  { key: 'lunch',     label: 'Lunch',     defaultTime: '14:00' },
  { key: 'snack2',    label: 'Snack 2',   defaultTime: '17:00' },
  { key: 'dinner',    label: 'Dinner',    defaultTime: '20:30' },
] as const

export type MealSlot = typeof MEAL_SLOTS[number]['key']

/**
 * Days are stored 0=Sunday…6=Saturday to match JS Date.getDay() and the
 * routine_days convention. The UI reads Monday-first, hence this order.
 */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const

export const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

export function slotLabel(slot: MealSlot): string {
  return MEAL_SLOTS.find(s => s.key === slot)?.label ?? slot
}

function isMealSlot(v: string): v is MealSlot {
  return MEAL_SLOTS.some(s => s.key === v)
}

// ---------- Types -----------------------------------------------------------

export interface DietMeal {
  id: string
  user_id: string
  day_of_week: number
  slot: MealSlot
  title: string
  ingredients: string[]
  protein_g: number
  fat_g: number
  carbs_g: number
  created_at: string
  updated_at: string
}

export interface MealInput {
  title: string
  ingredientsText: string
  protein: number | string
  fat: number | string
  carbs: number | string
}

export interface MealReminder {
  user_id: string
  slot: MealSlot
  hora: string
  activa: boolean
  timezone: string
}

export interface MacroTotals {
  protein: number
  fat: number
  carbs: number
}

export type MealsByDay = Record<number, DietMeal[]>

// ---------- Pure helpers ----------------------------------------------------

/** One ingredient per line. Trims, drops blanks, and enforces both limits. */
export function parseIngredients(text: string): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => l.slice(0, LIMITS.ingredient.max))
    .slice(0, LIMITS.ingredientsCount.max)
}

/** Inverse of parseIngredients, for loading the textarea. */
export function formatIngredients(list: string[]): string {
  return (list ?? []).join('\n')
}

export function sumMacros(meals: DietMeal[]): MacroTotals {
  return (meals ?? []).reduce<MacroTotals>((acc, m) => ({
    protein: acc.protein + Number(m.protein_g ?? 0),
    fat: acc.fat + Number(m.fat_g ?? 0),
    carbs: acc.carbs + Number(m.carbs_g ?? 0),
  }), { protein: 0, fat: 0, carbs: 0 })
}

/** Atwater factors: 4 kcal/g protein, 9 kcal/g fat, 4 kcal/g carbs. */
export function kcal({ protein, fat, carbs }: MacroTotals): number {
  return Math.round(protein * 4 + fat * 9 + carbs * 4)
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

// ---------- Validation ------------------------------------------------------

function requireDayOfWeek(dayOfWeek: number): number {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ValidationError('Day must be between 0 and 6')
  }
  return dayOfWeek
}

function requireSlot(slot: string): MealSlot {
  if (!isMealSlot(slot)) throw new ValidationError(`Unknown meal slot: ${slot}`)
  return slot
}

/** Shared shape for insert/upsert of one meal row. */
function mealRow(userId: string, dayOfWeek: number, slot: MealSlot, input: MealInput) {
  const { min, max } = LIMITS.macroGrams
  return {
    user_id: userId,
    day_of_week: requireDayOfWeek(dayOfWeek),
    slot: requireSlot(slot),
    title: requireString(input.title, LIMITS.mealTitle.min, LIMITS.mealTitle.max, 'Meal name'),
    ingredients: parseIngredients(input.ingredientsText),
    protein_g: boundedNumber(input.protein, min, max, 'Protein'),
    fat_g: boundedNumber(input.fat, min, max, 'Fat'),
    carbs_g: boundedNumber(input.carbs, min, max, 'Carbs'),
  }
}

// ---------- Meals -----------------------------------------------------------

/** Loads the whole week (max 35 rows) in one round trip, grouped by day. */
export async function getWeekMeals(userId: string): Promise<MealsByDay> {
  const { data, error } = await supabase
    .from('diet_meals')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week')
    .order('created_at')
  if (error) throw error

  const byDay: MealsByDay = {}
  for (const meal of (data ?? []) as DietMeal[]) {
    if (!byDay[meal.day_of_week]) byDay[meal.day_of_week] = []
    byDay[meal.day_of_week].push(meal)
  }
  return byDay
}

export async function upsertMeal(
  userId: string, dayOfWeek: number, slot: MealSlot, input: MealInput
): Promise<DietMeal> {
  const row = mealRow(userId, dayOfWeek, slot, input)
  const { data, error } = await supabase
    .from('diet_meals')
    .upsert(row, { onConflict: 'user_id,day_of_week,slot' })
    .select('*')
    .single()
  if (error) throw error
  return data as DietMeal
}

export async function deleteMeal(mealId: string): Promise<void> {
  const { error } = await supabase.from('diet_meals').delete().eq('id', mealId)
  if (error) throw error
}

/**
 * Copies every meal of `fromDow` onto each day in `toDows`, overwriting the
 * target slots. The unique (user, day, slot) index makes this a single upsert.
 */
export async function copyDay(userId: string, fromDow: number, toDows: number[]): Promise<void> {
  requireDayOfWeek(fromDow)
  const targets = [...new Set(toDows)].map(requireDayOfWeek)
  if (targets.includes(fromDow)) {
    throw new ValidationError('Cannot copy a day onto itself')
  }
  if (targets.length === 0) return

  const { data, error } = await supabase
    .from('diet_meals')
    .select('slot, title, ingredients, protein_g, fat_g, carbs_g')
    .eq('user_id', userId)
    .eq('day_of_week', fromDow)
  if (error) throw error

  const source = (data ?? []) as DietMeal[]
  if (source.length === 0) return

  // Pick the columns explicitly: carrying the source `id` through would make
  // the upsert target the original rows instead of creating the clones.
  const rows = targets.flatMap(dow =>
    source.map(m => ({
      user_id: userId,
      day_of_week: dow,
      slot: m.slot,
      title: m.title,
      ingredients: m.ingredients,
      protein_g: m.protein_g,
      fat_g: m.fat_g,
      carbs_g: m.carbs_g,
    }))
  )

  const { error: writeError } = await supabase
    .from('diet_meals')
    .upsert(rows, { onConflict: 'user_id,day_of_week,slot' })
  if (writeError) throw writeError
}

// ---------- Reminders -------------------------------------------------------

export async function getMealReminders(userId: string): Promise<MealReminder[]> {
  const { data, error } = await supabase
    .from('meal_reminders')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as MealReminder[]
}

export async function saveMealReminder(
  userId: string, slot: MealSlot, hora: string, activa: boolean, timezone: string
): Promise<void> {
  requireSlot(slot)
  if (!TIME_RE.test(hora)) throw new ValidationError('Time must be HH:MM')
  const tz = requireString(timezone, 1, LIMITS.timezone.max, 'Timezone')

  const { error } = await supabase
    .from('meal_reminders')
    .upsert({ user_id: userId, slot, hora, activa, timezone: tz }, { onConflict: 'user_id,slot' })
  if (error) throw error
}
