import { describe, it, expect } from 'vitest'
import { mapAuthError, isEmailNotConfirmed } from './authErrors'

describe('mapAuthError', () => {
  it('maps invalid credentials to a friendly message', () => {
    expect(mapAuthError('Invalid login credentials')).toBe('Email or password is incorrect.')
  })

  it('maps unconfirmed email to a friendly message', () => {
    expect(mapAuthError('Email not confirmed')).toMatch(/confirm your email/i)
  })

  it('maps duplicate registration to a friendly message', () => {
    expect(mapAuthError('User already registered')).toMatch(/already exists/i)
  })

  it('maps rate limit to a friendly message', () => {
    expect(mapAuthError('rate limit exceeded')).toMatch(/too many/i)
  })

  it('returns generic fallback for empty input', () => {
    expect(mapAuthError(undefined)).toMatch(/something went wrong/i)
  })

  it('passes through unknown errors so we still surface info', () => {
    expect(mapAuthError('some weird supabase error')).toBe('some weird supabase error')
  })
})

describe('isEmailNotConfirmed', () => {
  it('detects email-not-confirmed errors regardless of casing', () => {
    expect(isEmailNotConfirmed('Email not confirmed')).toBe(true)
    expect(isEmailNotConfirmed('email NOT confirmed')).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isEmailNotConfirmed('Invalid login credentials')).toBe(false)
    expect(isEmailNotConfirmed(undefined)).toBe(false)
  })
})
