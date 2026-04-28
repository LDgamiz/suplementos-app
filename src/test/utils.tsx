import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter, Outlet, Routes, Route } from 'react-router-dom'
import type { LayoutCtx } from '../layout/context'

export function renderWithRouter(
  ui: ReactNode,
  { route = '/', ...options }: { route?: string } & Omit<RenderOptions, 'wrapper'> = {}
) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, options)
}

/**
 * Renders a component that consumes useLayoutCtx() inside a router with the
 * given context value (mimics what AppLayout would pass via Outlet).
 */
export function renderWithLayoutCtx(
  ui: ReactNode,
  ctx: LayoutCtx,
  { route = '/' }: { route?: string } = {}
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<Outlet context={ctx} />}>
          <Route path="*" element={ui} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
