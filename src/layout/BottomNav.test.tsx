import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../test/utils'
import BottomNav from './BottomNav'

describe('BottomNav', () => {
  it('shows Supps, Profile, Support always', () => {
    renderWithRouter(<BottomNav isAdmin={false} />)
    expect(screen.getByRole('link', { name: /supps/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /support/i })).toBeInTheDocument()
  })

  it('hides Admin link when isAdmin=false', () => {
    renderWithRouter(<BottomNav isAdmin={false} />)
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })

  it('shows Admin link when isAdmin=true and points to /admin', async () => {
    renderWithRouter(<BottomNav isAdmin={true} />)
    const link = screen.getByRole('link', { name: /admin/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/admin')
  })
})
