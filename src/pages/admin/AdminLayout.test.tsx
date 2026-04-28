import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Routes, Route } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import type { LayoutCtx } from '../../layout/context'
import { makeSession, makePerfil } from '../../test/mocks/supabase'

function renderAdmin(ctx: LayoutCtx, route = '/admin') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<Outlet context={ctx} />}>
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/" element={<div>HOME</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminLayout gating', () => {
  it('renders nothing while perfil is loading (null)', () => {
    const { container } = renderAdmin({
      session: makeSession(),
      perfil: null,
      isAdmin: false,
    })
    // null returned from AdminLayout, no admin UI rendered
    expect(container.querySelector('h1')).toBeNull()
  })

  it('redirects to / when user is not admin', () => {
    renderAdmin({
      session: makeSession(),
      perfil: makePerfil({ role: 'user' }),
      isAdmin: false,
    })
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('renders admin UI when user is admin', () => {
    renderAdmin({
      session: makeSession(),
      perfil: makePerfil({ role: 'admin' }),
      isAdmin: true,
    })
    expect(screen.getByRole('heading', { name: /admin/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /catalog/i })).toBeInTheDocument()
  })
})
