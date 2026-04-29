import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeSuplementoCat } from '../../test/mocks/supabase'

const initialCats = [
  makeSuplementoCat({ id: 'a1', name: 'Approved A', status: 'approved' }),
  makeSuplementoCat({ id: 'p1', name: 'Pending P', status: 'pending', created_by: 'user-2' }),
  makeSuplementoCat({ id: 'r1', name: 'Rejected R', status: 'rejected' }),
]

const updateMock = vi.fn()
const updateEqMock = vi.fn()

vi.mock('../../supabaseClient', () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'suplementos_cat') {
          return {
            select: () => ({
              order: () => Promise.resolve({ data: initialCats, error: null }),
            }),
            update: (payload: unknown) => {
              updateMock(payload)
              return {
                eq: (col: string, val: unknown) => {
                  updateEqMock(col, val)
                  return Promise.resolve({ error: null })
                },
              }
            },
          }
        }
        if (table === 'perfiles') {
          return {
            select: () => ({
              in: () => Promise.resolve({
                data: [{ user_id: 'user-2', username: 'bob' }],
                error: null,
              }),
            }),
          }
        }
        return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }
      }),
    },
  }
})

import AdminCatalog from './AdminCatalog'

beforeEach(() => {
  updateMock.mockClear()
  updateEqMock.mockClear()
})

describe('AdminCatalog moderation', () => {
  it('defaults to the Pending tab and only shows pending rows', async () => {
    render(<AdminCatalog />)
    await screen.findByText('Pending P')
    expect(screen.queryByText('Approved A')).not.toBeInTheDocument()
    expect(screen.queryByText('Rejected R')).not.toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
  })

  it('switches tabs and shows approved rows', async () => {
    const user = userEvent.setup()
    render(<AdminCatalog />)
    await screen.findByText('Pending P')
    await user.click(screen.getByRole('button', { name: /^Approved/ }))
    expect(screen.getByText('Approved A')).toBeInTheDocument()
    expect(screen.queryByText('Pending P')).not.toBeInTheDocument()
  })

  it('clicking Approve updates status to approved', async () => {
    const user = userEvent.setup()
    render(<AdminCatalog />)
    const approveBtn = await screen.findByLabelText(/Approve Pending P/)
    await user.click(approveBtn)
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ status: 'approved' }))
    expect(updateEqMock).toHaveBeenCalledWith('id', 'p1')
  })

  it('clicking Reject updates status to rejected', async () => {
    const user = userEvent.setup()
    render(<AdminCatalog />)
    const rejectBtn = await screen.findByLabelText(/Reject Pending P/)
    await user.click(rejectBtn)
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ status: 'rejected' }))
    expect(updateEqMock).toHaveBeenCalledWith('id', 'p1')
  })
})
