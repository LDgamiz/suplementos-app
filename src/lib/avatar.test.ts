import { describe, it, expect, vi, beforeEach } from 'vitest'

const upload = vi.fn()
const getPublicUrl = vi.fn()
const storageFrom = vi.fn(() => ({ upload, getPublicUrl }))

vi.mock('../supabaseClient', () => ({
  supabase: { storage: { from: storageFrom } },
}))

beforeEach(() => {
  upload.mockReset()
  getPublicUrl.mockReset()
  storageFrom.mockClear()
  upload.mockResolvedValue({ data: { path: 'x' }, error: null })
  getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/avatar.jpg' } })
})

describe('uploadAvatar', () => {
  it('uploads to <userId>/avatar.<ext> and returns a cache-busted URL', async () => {
    const { uploadAvatar } = await import('./avatar')
    const file = new File(['data'], 'photo.PNG', { type: 'image/png' })
    const url = await uploadAvatar(file, 'abc-123')

    expect(storageFrom).toHaveBeenCalledWith('avatars')
    const [path, fileArg, opts] = upload.mock.calls[0]
    expect(path).toBe('abc-123/avatar.png')
    expect(fileArg).toBe(file)
    expect(opts).toMatchObject({ upsert: true, contentType: 'image/png' })
    expect(url).toMatch(/^https:\/\/cdn\.test\/avatar\.jpg\?t=\d+$/)
  })

  it('lowercases the extension', async () => {
    const { uploadAvatar } = await import('./avatar')
    const file = new File(['data'], 'pic.JPEG', { type: 'image/jpeg' })
    await uploadAvatar(file, 'u1')
    expect(upload.mock.calls[0][0]).toBe('u1/avatar.jpeg')
  })

  it('throws when storage upload returns an error', async () => {
    upload.mockResolvedValueOnce({ data: null, error: { message: 'denied' } })
    const { uploadAvatar } = await import('./avatar')
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    await expect(uploadAvatar(file, 'u1')).rejects.toMatchObject({ message: 'denied' })
  })
})
