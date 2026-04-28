import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createSupabaseMock, makeSession } from '../test/mocks/supabase'

const mockClient = createSupabaseMock()
vi.mock('../supabaseClient', () => ({ supabase: mockClient }))

function rachaBuilder(data: { fecha: string; tomado: boolean }[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

// Mirror exactly the date computation in useRacha.ts so test keys line up
// regardless of timezone: setDate (local) then toISOString (UTC).
function rachaKey(daysBack: number): string {
  const hoy = new Date()
  const d = new Date(hoy)
  d.setDate(hoy.getDate() - daysBack)
  return d.toISOString().split('T')[0]
}

beforeEach(() => {
  mockClient.from.mockReset()
  // Only fake Date so RTL waitFor (which uses setTimeout) keeps working
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-04-28T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useRacha', () => {
  it('returns 0 with no session and never queries supabase', async () => {
    const { useRacha } = await import('./useRacha')
    const { result } = renderHook(() => useRacha(null))
    expect(result.current.racha).toBe(0)
    expect(mockClient.from).not.toHaveBeenCalled()
  })

  it('returns 0 when there are no records', async () => {
    mockClient.from.mockImplementation(() => rachaBuilder([]))
    const { useRacha } = await import('./useRacha')
    const { result } = renderHook(() => useRacha(makeSession()))
    await waitFor(() => expect(mockClient.from).toHaveBeenCalled())
    // no data path returns early without setting racha; stays 0
    expect(result.current.racha).toBe(0)
  })

  it('counts 5 consecutive days fully completed', async () => {
    // today (0) and the 4 prior days, each with 2 supplements both taken
    const data = [0, 1, 2, 3, 4].flatMap(off => [
      { fecha: rachaKey(off), tomado: true },
      { fecha: rachaKey(off), tomado: true },
    ])
    mockClient.from.mockImplementation(() => rachaBuilder(data))
    const { useRacha } = await import('./useRacha')
    const { result } = renderHook(() => useRacha(makeSession()))
    await waitFor(() => expect(result.current.racha).toBe(5))
  })

  it('breaks when a day is missing entirely', async () => {
    // today + yesterday complete, day 2 days ago missing -> racha = 2
    const data = [
      { fecha: rachaKey(0), tomado: true },
      { fecha: rachaKey(1), tomado: true },
      { fecha: rachaKey(3), tomado: true },
    ]
    mockClient.from.mockImplementation(() => rachaBuilder(data))
    const { useRacha } = await import('./useRacha')
    const { result } = renderHook(() => useRacha(makeSession()))
    await waitFor(() => expect(result.current.racha).toBe(2))
  })

  it('breaks when a day has untaken supplements', async () => {
    // today complete, yesterday has one not-taken
    const data = [
      { fecha: rachaKey(0), tomado: true },
      { fecha: rachaKey(1), tomado: true },
      { fecha: rachaKey(1), tomado: false },
    ]
    mockClient.from.mockImplementation(() => rachaBuilder(data))
    const { useRacha } = await import('./useRacha')
    const { result } = renderHook(() => useRacha(makeSession()))
    await waitFor(() => expect(result.current.racha).toBe(1))
  })

  it('breaks immediately when today has no records', async () => {
    // only yesterday has data
    const data = [{ fecha: rachaKey(1), tomado: true }]
    mockClient.from.mockImplementation(() => rachaBuilder(data))
    const { useRacha } = await import('./useRacha')
    const { result } = renderHook(() => useRacha(makeSession()))
    await waitFor(() => expect(mockClient.from).toHaveBeenCalled())
    expect(result.current.racha).toBe(0)
  })
})
