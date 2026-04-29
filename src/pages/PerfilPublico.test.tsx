import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render } from '@testing-library/react'

vi.mock('../hooks/usePublicProfile', () => ({
  usePublicProfile: vi.fn(),
}))
vi.mock('../hooks/useRacha', async () => {
  const actual = await vi.importActual<typeof import('../hooks/useRacha')>('../hooks/useRacha')
  return { ...actual, useRachaForUser: vi.fn(() => ({ racha: 7 })) }
})
vi.mock('../WeeklyChart', () => ({
  default: () => <div data-testid="weekly-chart" />,
}))

import PerfilPublico from './PerfilPublico'
import { usePublicProfile } from '../hooks/usePublicProfile'

function renderAt(username: string) {
  return render(
    <MemoryRouter initialEntries={[`/perfil/${username}`]}>
      <Routes>
        <Route path="/perfil/:username" element={<PerfilPublico />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PerfilPublico', () => {
  it('shows the not-found state when notFound is true', () => {
    vi.mocked(usePublicProfile).mockReturnValue({
      perfil: null, suplementosHoy: [], loading: false, notFound: true,
    })
    renderAt('ghost')
    expect(screen.getByRole('heading', { name: /profile not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(usePublicProfile).mockReturnValue({
      perfil: null, suplementosHoy: [], loading: true, notFound: false,
    })
    renderAt('alice')
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders perfil with name, racha, today stats and supplements', () => {
    vi.mocked(usePublicProfile).mockReturnValue({
      perfil: {
        user_id: 'u-1', username: 'alice', full_name: 'Alice A.',
        avatar_url: null, bio: 'Lifting fan', created_at: '2026-01-01',
      },
      suplementosHoy: [
        { id: 1, dosis: '5g', tomado: true, suplementos_cat: { name: 'Creatine', category: 'amino' } },
        { id: 2, dosis: '1000 IU', tomado: false, suplementos_cat: { name: 'Vitamin D', category: 'vitamin' } },
      ],
      loading: false,
      notFound: false,
    })
    renderAt('alice')

    expect(screen.getByRole('heading', { name: 'Alice A.' })).toBeInTheDocument()
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.getByText('Lifting fan')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument() // racha
    expect(screen.getByText('Creatine')).toBeInTheDocument()
    expect(screen.getByText('Vitamin D')).toBeInTheDocument()
    expect(screen.getByText('5g')).toBeInTheDocument()
    expect(screen.getByTestId('weekly-chart')).toBeInTheDocument()
  })
})
