import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createSupabaseMock } from '../test/mocks/supabase'

const mockClient = createSupabaseMock()
vi.mock('../supabaseClient', () => ({ supabase: mockClient }))

beforeEach(() => {
  mockClient.from.mockReset()
})

function perfilBuilder(perfilRow: any) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: perfilRow, error: null }),
  }
}

function suplementosBuilder(rows: any[]) {
  const b: any = {
    select: vi.fn().mockReturnThis(),
  }
  let eqCalls = 0
  b.eq = vi.fn().mockImplementation(() => {
    eqCalls++
    if (eqCalls < 3) return b
    return Object.assign(b, { then: (r: any) => Promise.resolve({ data: rows, error: null }).then(r) })
  })
  return b
}

describe('usePublicProfile', () => {
  it('marks notFound when username is undefined', async () => {
    const { usePublicProfile } = await import('./usePublicProfile')
    const { result } = renderHook(() => usePublicProfile(undefined))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(true)
    expect(result.current.perfil).toBeNull()
    expect(mockClient.from).not.toHaveBeenCalled()
  })

  it('marks notFound when the username does not exist', async () => {
    mockClient.from.mockImplementationOnce(() => perfilBuilder(null))
    const { usePublicProfile } = await import('./usePublicProfile')
    const { result } = renderHook(() => usePublicProfile('ghost'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(true)
    expect(result.current.perfil).toBeNull()
  })

  it('loads the perfil and today public supplements', async () => {
    const perfilRow = {
      user_id: 'u-1', username: 'alice', full_name: 'Alice',
      avatar_url: null, bio: 'hi', created_at: '2026-01-01',
    }
    const sups = [
      { id: 1, dosis: '1g', tomado: true, suplementos_cat: { name: 'Creatine', category: 'amino' } },
    ]
    mockClient.from
      .mockImplementationOnce(() => perfilBuilder(perfilRow))
      .mockImplementationOnce(() => suplementosBuilder(sups))

    const { usePublicProfile } = await import('./usePublicProfile')
    const { result } = renderHook(() => usePublicProfile('alice'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(false)
    expect(result.current.perfil?.username).toBe('alice')
    expect(result.current.suplementosHoy).toHaveLength(1)
    expect(result.current.suplementosHoy[0].suplementos_cat?.name).toBe('Creatine')
  })
})
