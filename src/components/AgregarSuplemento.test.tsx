import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeSuplementoCat } from '../test/mocks/supabase'

const h = vi.hoisted(() => ({
  catSelectResult: { data: [] as any[], error: null as null | { message: string } },
  insertResult: { data: null as any, error: null as null | { message: string } },
  insertMock: vi.fn(),
}))

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: () => ({
        ilike: () => ({
          limit: () => Promise.resolve(h.catSelectResult),
        }),
      }),
      insert: (rows: unknown[]) => {
        h.insertMock(rows)
        return {
          select: () => ({
            single: () => Promise.resolve(h.insertResult),
          }),
        }
      },
    })),
  },
}))

import AgregarSuplemento from './AgregarSuplemento'

beforeEach(() => {
  h.catSelectResult.data = [makeSuplementoCat({ id: 'cat-1', name: 'Vitamin D' })]
  h.insertResult = { data: makeSuplementoCat({ id: 'cat-new', name: 'Newthing', status: 'pending' }), error: null }
  h.insertMock.mockClear()
})

describe('AgregarSuplemento', () => {
  it('selects an existing supplement and calls onAgregar with id and dose', async () => {
    const user = userEvent.setup()
    const onAgregar = vi.fn()
    render(<AgregarSuplemento onAgregar={onAgregar} userId="user-1" />)

    await user.type(screen.getByPlaceholderText(/search supplement/i), 'Vita')
    const item = await screen.findByText('Vitamin D')
    await user.click(item)

    await user.click(screen.getByRole('button', { name: /^add$/i }))

    expect(onAgregar).toHaveBeenCalledWith('cat-1', expect.stringMatching(/IU/))
  })

  it('creates a new catalog entry as pending with created_by and shows submitted-for-review feedback', async () => {
    h.catSelectResult.data = []
    const user = userEvent.setup()
    render(<AgregarSuplemento onAgregar={vi.fn()} userId="user-1" />)

    await user.type(screen.getByPlaceholderText(/search supplement/i), 'Newthing')

    // Wait for the empty-state CTA to appear in the dropdown
    const matches = await screen.findAllByText(
      (_, el) => el?.tagName === 'DIV' && /add ".*" to catalog/i.test(el.textContent ?? ''),
      undefined,
      { timeout: 3000 }
    )
    const addToCat = matches.find(el => el.className.includes('cursor-pointer'))!
    await user.click(addToCat)

    await user.type(screen.getByPlaceholderText(/^category/i), 'vitamin')
    await user.type(screen.getByPlaceholderText(/dose amount/i), '100')
    await user.type(screen.getByPlaceholderText(/^unit/i), 'mg')

    await user.click(screen.getByRole('button', { name: /add to catalog/i }))

    await waitFor(() => expect(h.insertMock).toHaveBeenCalled())
    const payload = h.insertMock.mock.calls[0][0][0]
    expect(payload).toMatchObject({
      name: 'Newthing',
      category: 'vitamin',
      recommended_dose: 100,
      dose_unit: 'mg',
      status: 'pending',
      created_by: 'user-1',
    })

    expect(await screen.findByText(/submitted for review/i)).toBeInTheDocument()
  })
})
