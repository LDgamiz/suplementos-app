import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../test/utils'
import SideMenu from './SideMenu'

describe('SideMenu', () => {
  it('renders the user email and main nav items', () => {
    renderWithRouter(
      <SideMenu isAdmin={false} email="alice@test.com" onSignOut={() => {}} />
    )
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /supplements/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /training/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /support/i })).toBeInTheDocument()
  })

  it('hides Admin when not admin', () => {
    renderWithRouter(<SideMenu isAdmin={false} email="x@y.z" onSignOut={() => {}} />)
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument()
  })

  it('shows Admin when admin and points to /admin', () => {
    renderWithRouter(<SideMenu isAdmin={true} email="x@y.z" onSignOut={() => {}} />)
    const link = screen.getByRole('link', { name: /^admin$/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/admin')
  })

  it('calls onSignOut when sign out button is clicked', async () => {
    const onSignOut = vi.fn()
    const user = userEvent.setup()
    renderWithRouter(
      <SideMenu isAdmin={false} email="x@y.z" onSignOut={onSignOut} />
    )
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(onSignOut).toHaveBeenCalledOnce()
  })
})
