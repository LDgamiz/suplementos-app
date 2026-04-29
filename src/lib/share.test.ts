import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shareImage } from './share'

const blob = () => new Blob(['x'], { type: 'image/png' })
const opts = { title: 'T', text: 'X', filename: 'f.png' }

beforeEach(() => {
  vi.mocked(navigator.share).mockReset().mockResolvedValue(undefined)
  vi.mocked(navigator.canShare).mockReset().mockReturnValue(true)
})

describe('shareImage', () => {
  it('uses navigator.share when canShare returns true', async () => {
    const result = await shareImage(blob(), opts)
    expect(result).toBe('shared')
    expect(navigator.share).toHaveBeenCalledOnce()
    const arg = vi.mocked(navigator.share).mock.calls[0][0]!
    expect(arg.title).toBe('T')
    expect(arg.files?.[0]).toBeInstanceOf(File)
    expect(arg.files?.[0].name).toBe('f.png')
  })

  it('falls back to download when canShare returns false', async () => {
    vi.mocked(navigator.canShare).mockReturnValue(false)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const result = await shareImage(blob(), opts)

    expect(result).toBe('downloaded')
    expect(navigator.share).not.toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalledOnce()
    clickSpy.mockRestore()
  })

  it('treats AbortError from share as a successful share (user cancelled)', async () => {
    const err = new Error('cancelled')
    err.name = 'AbortError'
    vi.mocked(navigator.share).mockRejectedValueOnce(err)

    const result = await shareImage(blob(), opts)
    expect(result).toBe('shared')
  })

  it('falls back to download when share rejects with a non-abort error', async () => {
    vi.mocked(navigator.share).mockRejectedValueOnce(new Error('boom'))
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const result = await shareImage(blob(), opts)
    expect(result).toBe('downloaded')
    clickSpy.mockRestore()
  })
})
