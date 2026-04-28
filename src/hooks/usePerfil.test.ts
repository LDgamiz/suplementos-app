import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createSupabaseMock, makeSession, makePerfil } from '../test/mocks/supabase'

const mockClient = createSupabaseMock()
vi.mock('../supabaseClient', () => ({ supabase: mockClient }))

beforeEach(() => {
  mockClient.from.mockClear()
})

describe('usePerfil', () => {
  it('returns null perfil and loading=false when no session', async () => {
    const { usePerfil } = await import('./usePerfil')
    const { result } = renderHook(() => usePerfil(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.perfil).toBeNull()
    expect(mockClient.from).not.toHaveBeenCalled()
  })

  it('loads the perfil for the session user', async () => {
    const perfil = makePerfil({ username: 'alice', role: 'admin' })
    mockClient.from.mockImplementationOnce(() => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: perfil, error: null }),
      }
      return builder
    })

    const session = makeSession()
    const { usePerfil } = await import('./usePerfil')
    const { result } = renderHook(() => usePerfil(session))
    await waitFor(() => expect(result.current.perfil).toEqual(perfil))
    expect(mockClient.from).toHaveBeenCalledWith('perfiles')
  })

  it('refresh re-runs the query', async () => {
    const session = makeSession()
    let calls = 0
    mockClient.from.mockImplementation(() => {
      calls++
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: makePerfil(), error: null }),
      }
      return builder
    })
    const { usePerfil } = await import('./usePerfil')
    const { result } = renderHook(() => usePerfil(session))
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = calls
    await act(async () => { await result.current.refresh() })
    expect(calls).toBeGreaterThan(before)
  })
})
