import { describe, it, expect } from 'vitest'
import { getLocalDateString } from './dates'

describe('getLocalDateString', () => {
  it('returns local YYYY-MM-DD components, not UTC', () => {
    // Build a Date with explicit LOCAL components.
    // Whatever the runner's TZ is, getLocalDateString must echo the same local y-m-d.
    const d = new Date(2026, 4, 5, 23, 30, 0) // May 5, 2026 23:30 local
    expect(getLocalDateString(d)).toBe('2026-05-05')
  })

  it('does not roll to the next day at night (regression: UTC bug)', () => {
    // The bug: new Date(...).toISOString().split('T')[0] would return the next day
    // for late-evening local times in negative-offset zones (e.g. UTC-6 after 18:00).
    // With local-component formatting we always stay on the same calendar day.
    const lateNight = new Date(2026, 0, 1, 23, 59, 59) // Jan 1, 2026 23:59 local
    expect(getLocalDateString(lateNight)).toBe('2026-01-01')
  })

  it('pads single-digit month and day with zeros', () => {
    const d = new Date(2026, 0, 7, 12, 0, 0) // Jan 7, 2026
    expect(getLocalDateString(d)).toBe('2026-01-07')
  })
})
