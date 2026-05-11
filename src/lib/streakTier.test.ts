import { describe, it, expect } from 'vitest'
import { streakTier } from './streakTier'

describe('streakTier', () => {
  it('returns null below the first tier (racha < 3)', () => {
    expect(streakTier(0)).toBeNull()
    expect(streakTier(1)).toBeNull()
    expect(streakTier(2)).toBeNull()
  })

  it('unlocks "Warming up" at 3, holds until 7', () => {
    expect(streakTier(3)?.label).toBe('Warming up')
    expect(streakTier(6)?.label).toBe('Warming up')
  })

  it('unlocks "On fire" at 7, holds until 14', () => {
    expect(streakTier(7)?.label).toBe('On fire')
    expect(streakTier(13)?.label).toBe('On fire')
  })

  it('unlocks "Locked in" at 14, holds until 30', () => {
    expect(streakTier(14)?.label).toBe('Locked in')
    expect(streakTier(29)?.label).toBe('Locked in')
  })

  it('unlocks "Relentless" at 30, holds until 100', () => {
    expect(streakTier(30)?.label).toBe('Relentless')
    expect(streakTier(99)?.label).toBe('Relentless')
  })

  it('unlocks "Legend" at 100 and beyond', () => {
    expect(streakTier(100)?.label).toBe('Legend')
    expect(streakTier(365)?.label).toBe('Legend')
  })

  it('returns the threshold along with the label', () => {
    expect(streakTier(45)).toEqual({ threshold: 30, label: 'Relentless' })
  })
})
