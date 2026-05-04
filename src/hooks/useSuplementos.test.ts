import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createSupabaseMock, makeSession, makeSuplemento } from '../test/mocks/supabase'

const mockClient = createSupabaseMock()
vi.mock('../supabaseClient', () => ({ supabase: mockClient }))

function mockFromOnce(impl: (table: string) => any) {
  mockClient.from.mockImplementationOnce(impl)
}

function selectBuilder(data: any, error: any = null) {
  const b: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }
  // Make eq().eq() resolve as a thenable when awaited
  b.eq.mockImplementation(() => {
    return Object.assign(b, { then: (r: any) => Promise.resolve({ data, error }).then(r) })
  })
  return b
}

beforeEach(() => {
  mockClient.from.mockReset()
})

describe('useSuplementos', () => {
  it('loads suplementos on mount', async () => {
    const items = [makeSuplemento({ id: 1 }), makeSuplemento({ id: 2 })]
    mockFromOnce(() => selectBuilder(items))

    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-04-28'))
    await waitFor(() => expect(result.current.suplementos).toHaveLength(2))
  })

  it('agregarSuplemento writes the selected fecha, not today', async () => {
    mockFromOnce(() => selectBuilder([]))
    const insert = vi.fn().mockReturnThis()
    const select = vi.fn().mockResolvedValue({ data: [makeSuplemento({ fecha: '2026-05-02' })], error: null })
    mockFromOnce(() => ({ insert, select }))

    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-05-02'))
    await waitFor(() => expect(result.current.suplementos).toEqual([]))

    await act(async () => { await result.current.agregarSuplemento('cat-1', '5g') })

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ suplemento_id: 'cat-1', dosis: '5g', fecha: '2026-05-02' }),
    ])
  })

  it('aplicarRutina writes rows with the selected fecha', async () => {
    mockFromOnce(() => selectBuilder([]))
    const insert = vi.fn().mockReturnThis()
    const select = vi.fn().mockResolvedValue({ data: [], error: null })
    mockFromOnce(() => ({ insert, select }))

    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-05-02'))
    await waitFor(() => expect(result.current.suplementos).toEqual([]))

    await act(async () => {
      await result.current.aplicarRutina([
        { suplemento_id: 'a', dosis: '1g' },
        { suplemento_id: 'b', dosis: '2g' },
      ])
    })

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ suplemento_id: 'a', fecha: '2026-05-02' }),
      expect.objectContaining({ suplemento_id: 'b', fecha: '2026-05-02' }),
    ])
  })

  it('does not insert when suplemento_id or dosis is missing', async () => {
    mockFromOnce(() => selectBuilder([]))
    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-04-28'))
    await waitFor(() => expect(result.current.suplementos).toEqual([]))

    await act(async () => { await result.current.agregarSuplemento('', '500mg') })
    await act(async () => { await result.current.agregarSuplemento('cat-1', '') })

    // No second from() call beyond initial load
    expect(mockClient.from).toHaveBeenCalledTimes(1)
  })

  it('marcarTomado toggles tomado and bumps refreshKey', async () => {
    const item = makeSuplemento({ id: 1, tomado: false })
    mockFromOnce(() => selectBuilder([item]))
    mockFromOnce(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))

    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-04-28'))
    await waitFor(() => expect(result.current.suplementos).toHaveLength(1))
    const keyBefore = result.current.refreshKey

    await act(async () => { await result.current.marcarTomado(1) })

    expect(result.current.suplementos[0].tomado).toBe(true)
    expect(result.current.refreshKey).toBeGreaterThan(keyBefore)
  })

  it('eliminarSuplemento removes from local state on success', async () => {
    const item = makeSuplemento({ id: 7 })
    mockFromOnce(() => selectBuilder([item]))
    mockFromOnce(() => ({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))

    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-04-28'))
    await waitFor(() => expect(result.current.suplementos).toHaveLength(1))

    await act(async () => { await result.current.eliminarSuplemento(7) })
    expect(result.current.suplementos).toHaveLength(0)
  })

  it('togglePublico flips publico flag', async () => {
    const item = makeSuplemento({ id: 3, publico: false })
    mockFromOnce(() => selectBuilder([item]))
    mockFromOnce(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))

    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-04-28'))
    await waitFor(() => expect(result.current.suplementos).toHaveLength(1))

    await act(async () => { await result.current.togglePublico(3, false) })
    expect(result.current.suplementos[0].publico).toBe(true)
  })

  it('editarSuplemento updates local dose', async () => {
    const item = makeSuplemento({ id: 5, dosis: '500mg' })
    mockFromOnce(() => selectBuilder([item]))
    mockFromOnce(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))

    const session = makeSession()
    const { useSuplementos } = await import('./useSuplementos')
    const { result } = renderHook(() => useSuplementos(session, '2026-04-28'))
    await waitFor(() => expect(result.current.suplementos).toHaveLength(1))

    await act(async () => { await result.current.editarSuplemento(5, '1000mg') })
    expect(result.current.suplementos[0].dosis).toBe('1000mg')
  })
})
