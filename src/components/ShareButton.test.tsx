import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../test/utils'
import ShareButton from './ShareButton'

vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake-png'], { type: 'image/png' })),
}))

const baseProps = {
  fullName: 'Alice',
  username: 'alice',
  avatarUrl: null,
  bio: null,
  racha: 7,
  tomados: 3,
  total: 4,
  pct: 75,
  suplementos: [{ name: 'Creatine', dosis: '5g', tomado: true }],
}

beforeEach(() => {
  vi.mocked(navigator.share).mockReset().mockResolvedValue(undefined)
  vi.mocked(navigator.canShare).mockReset().mockReturnValue(true)
})

describe('ShareButton', () => {
  it('renders a "Set username" link when username is null', () => {
    renderWithRouter(<ShareButton {...baseProps} username={null} />)
    const link = screen.getByRole('link', { name: /set username/i })
    expect(link).toHaveAttribute('href', '/profile')
  })

  it('calls navigator.share with a PNG file when clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ShareButton {...baseProps} />)

    await user.click(screen.getByRole('button', { name: /share as image/i }))

    await waitFor(() => expect(navigator.share).toHaveBeenCalled())
    const arg = vi.mocked(navigator.share).mock.calls[0][0]!
    expect(arg.files?.[0]).toBeInstanceOf(File)
    expect(arg.files?.[0].name).toBe('my-supplements-alice.png')
    expect(arg.text).toContain('@alice')
  })

  it('falls back to download when canShare is false', async () => {
    vi.mocked(navigator.canShare).mockReturnValue(false)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const user = userEvent.setup()
    renderWithRouter(<ShareButton {...baseProps} />)
    await user.click(screen.getByRole('button', { name: /share as image/i }))

    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(navigator.share).not.toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('shows a loading label while generating', async () => {
    const { toBlob } = await import('html-to-image')
    let resolveBlob: (b: Blob) => void = () => {}
    vi.mocked(toBlob).mockImplementationOnce(
      () => new Promise(r => { resolveBlob = r as any })
    )

    const user = userEvent.setup()
    renderWithRouter(<ShareButton {...baseProps} />)
    await user.click(screen.getByRole('button', { name: /share as image/i }))

    await waitFor(() => expect(screen.getByText(/generating/i)).toBeInTheDocument())
    resolveBlob(new Blob(['x'], { type: 'image/png' }))
  })
})
