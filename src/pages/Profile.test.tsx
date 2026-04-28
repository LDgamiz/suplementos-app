import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithLayoutCtx } from '../test/utils'
import { makeSession, makePerfil, createSupabaseMock } from '../test/mocks/supabase'

const mockClient = createSupabaseMock()
vi.mock('../supabaseClient', () => ({ supabase: mockClient }))

vi.mock('../lib/avatar', () => ({
  uploadAvatar: vi.fn().mockResolvedValue('https://cdn.test/new.jpg'),
}))

beforeEach(() => {
  mockClient.from.mockReset()
})

async function renderProfile(perfilOverrides = {}) {
  const Profile = (await import('./Profile')).default
  return renderWithLayoutCtx(<Profile />, {
    session: makeSession(),
    perfil: makePerfil(perfilOverrides),
    isAdmin: false,
  })
}

describe('Profile - public username', () => {
  it('shows the username form when no username is set', async () => {
    await renderProfile({ username: null })
    expect(
      screen.getByPlaceholderText(/pick a username/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/can only be set once/i)
    ).toBeInTheDocument()
  })

  it('shows the immutability lock when username already exists', async () => {
    await renderProfile({ username: 'alice' })
    expect(screen.getByText(/@alice/)).toBeInTheDocument()
    expect(screen.getByText(/permanent and cannot be changed/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/pick a username/i)).not.toBeInTheDocument()
  })

  it('handles unique-violation error from supabase', async () => {
    mockClient.from.mockImplementation(() => ({
      upsert: vi.fn().mockResolvedValue({
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      }),
    }))

    const user = userEvent.setup()
    await renderProfile({ username: null })

    await user.type(screen.getByPlaceholderText(/pick a username/i), 'taken')
    await user.click(screen.getByRole('button', { name: /create public profile/i }))

    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument()
    })
  })

  it('handles trigger error when trying to change username', async () => {
    mockClient.from.mockImplementation(() => ({
      upsert: vi.fn().mockResolvedValue({
        error: { message: 'username cannot be changed once set' },
      }),
    }))

    const user = userEvent.setup()
    await renderProfile({ username: null })

    await user.type(screen.getByPlaceholderText(/pick a username/i), 'new')
    await user.click(screen.getByRole('button', { name: /create public profile/i }))

    await waitFor(() => {
      expect(screen.getByText(/cannot be changed once set/i)).toBeInTheDocument()
    })
  })
})

describe('Profile - personal data', () => {
  it('saves personal data via upsert', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mockClient.from.mockImplementation(() => ({ upsert }))

    const user = userEvent.setup()
    await renderProfile({ username: 'alice', full_name: 'Alice' })

    await user.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => expect(upsert).toHaveBeenCalled())
    const payload = upsert.mock.calls[0][0]
    expect(payload.user_id).toBe('user-1')
    expect(payload.full_name).toBe('Alice')
  })
})
