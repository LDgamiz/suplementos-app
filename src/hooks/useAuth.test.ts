import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createSupabaseMock, makeSession } from '../test/mocks/supabase'

const mockClient = createSupabaseMock()

vi.mock('../supabaseClient', () => ({ supabase: mockClient }))

beforeEach(() => {
  mockClient.auth.getSession.mockResolvedValue({ data: { session: null } })
  mockClient.auth.onAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: mockClient._internals.subscriptionUnsub } },
  }))
})

describe('useAuth', () => {
  it('starts with no session and resolves to null when no session exists', async () => {
    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())
    expect(result.current.session).toBeNull()
    await waitFor(() => {
      expect(mockClient.auth.getSession).toHaveBeenCalled()
    })
  })

  it('sets the session when getSession resolves with one', async () => {
    const session = makeSession()
    mockClient.auth.getSession.mockResolvedValueOnce({ data: { session } })
    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.session?.user.id).toBe('user-1'))
  })

  it('updates session when onAuthStateChange fires', async () => {
    let capturedCb: ((e: string, s: any) => void) | null = null
    mockClient.auth.onAuthStateChange.mockImplementationOnce((cb: any) => {
      capturedCb = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(capturedCb).not.toBeNull())
    act(() => { capturedCb!('SIGNED_IN', makeSession({ id: 'user-2' })) })
    await waitFor(() => expect(result.current.session?.user.id).toBe('user-2'))
  })

  it('exposes signOut delegating to supabase', async () => {
    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())
    await result.current.signOut()
    expect(mockClient.auth.signOut).toHaveBeenCalled()
  })

  it('unsubscribes on unmount', async () => {
    const unsub = vi.fn()
    mockClient.auth.onAuthStateChange.mockImplementationOnce(() => ({
      data: { subscription: { unsubscribe: unsub } },
    }))
    const { useAuth } = await import('./useAuth')
    const { unmount } = renderHook(() => useAuth())
    unmount()
    expect(unsub).toHaveBeenCalled()
  })
})
