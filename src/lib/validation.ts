// Defense-in-depth input validation. Server-side CHECK constraints (see
// supabase/migrations/data_integrity_v2.sql) mirror these limits — clients
// hitting Supabase directly cannot bypass them.

export const LIMITS = {
  username: { min: 3, max: 30, regex: /^[a-z0-9_]{3,30}$/ },
  fullName: { max: 100 },
  bio: { max: 500 },
  country: { max: 60 },
  goal: { max: 50 },
  activity: { max: 50 },
  supplementName: { min: 2, max: 100 },
  supplementCategory: { min: 2, max: 50 },
  doseUnit: { min: 1, max: 20 },
  doseAmount: { min: 0.001, max: 100000 },
  dosis: { min: 1, max: 100 },
  routineName: { min: 1, max: 100 },
  routineDayName: { max: 50 },
  exerciseName: { min: 1, max: 100 },
  exerciseSets: { min: 1, max: 20 },
  exerciseReps: { min: 0, max: 1000 },
  exerciseWeight: { min: 0, max: 2000 },
  repRange: { max: 30 },
  notes: { max: 500 },
  timezone: { max: 50 },
} as const

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function trimToMax(s: string | null | undefined, max: number): string {
  return (s ?? '').trim().slice(0, max)
}

export function requireString(s: string | null | undefined, min: number, max: number, field: string): string {
  const v = (s ?? '').trim()
  if (v.length < min) {
    throw new ValidationError(min === 1 ? `${field} is required` : `${field} must be at least ${min} characters`)
  }
  if (v.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`)
  }
  return v
}

export function optionalString(s: string | null | undefined, max: number): string | null {
  const v = (s ?? '').trim()
  if (v.length === 0) return null
  if (v.length > max) {
    throw new ValidationError(`Value must be at most ${max} characters`)
  }
  return v
}

export function boundedNumber(v: number | string | null | undefined, min: number, max: number, field: string): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  if (!Number.isFinite(n)) {
    throw new ValidationError(`${field} must be a number`)
  }
  if (n < min || n > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}`)
  }
  return n
}

export function isUsername(s: string): boolean {
  return LIMITS.username.regex.test(s)
}
