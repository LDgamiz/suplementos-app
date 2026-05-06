import { describe, it, expect } from 'vitest'
import {
  LIMITS,
  ValidationError,
  trimToMax,
  requireString,
  optionalString,
  boundedNumber,
  isUsername,
} from './validation'

describe('validation', () => {
  it('trimToMax trims and caps length', () => {
    expect(trimToMax('   hello   ', 50)).toBe('hello')
    expect(trimToMax('abcdefghij', 5)).toBe('abcde')
    expect(trimToMax(null, 5)).toBe('')
  })

  it('requireString throws on empty input', () => {
    expect(() => requireString('', 1, 100, 'Name')).toThrow(ValidationError)
    expect(() => requireString('   ', 1, 100, 'Name')).toThrow(/Name is required/)
  })

  it('requireString throws when too long', () => {
    expect(() => requireString('x'.repeat(101), 1, 100, 'Name')).toThrow(/at most 100/)
  })

  it('requireString returns trimmed value when valid', () => {
    expect(requireString('  Push / Pull / Legs ', 1, 100, 'Name')).toBe('Push / Pull / Legs')
  })

  it('optionalString returns null on empty, throws when too long', () => {
    expect(optionalString('', 30)).toBeNull()
    expect(optionalString(null, 30)).toBeNull()
    expect(optionalString('  ok  ', 30)).toBe('ok')
    expect(() => optionalString('x'.repeat(31), 30)).toThrow(ValidationError)
  })

  it('boundedNumber parses strings and enforces range', () => {
    expect(boundedNumber('5', 1, 20, 'Sets')).toBe(5)
    expect(boundedNumber(7.5, 0, 100, 'Weight')).toBe(7.5)
    expect(() => boundedNumber('abc', 0, 10, 'Weight')).toThrow(/must be a number/)
    expect(() => boundedNumber(21, 1, 20, 'Sets')).toThrow(/between 1 and 20/)
    expect(() => boundedNumber(-1, 0, 10, 'Reps')).toThrow(/between 0 and 10/)
  })

  it('isUsername matches the allowed format', () => {
    expect(isUsername('alice_99')).toBe(true)
    expect(isUsername('ab')).toBe(false)        // too short
    expect(isUsername('Alice')).toBe(false)     // uppercase
    expect(isUsername('a'.repeat(31))).toBe(false) // too long
    expect(isUsername('with space')).toBe(false)
  })

  it('LIMITS exposes the documented numeric bounds', () => {
    expect(LIMITS.exerciseSets.max).toBe(20)
    expect(LIMITS.dosis.max).toBe(100)
    expect(LIMITS.username.regex.test('ok_user')).toBe(true)
  })
})
