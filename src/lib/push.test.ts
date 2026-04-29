import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const upsert = vi.fn()
const del = vi.fn()
const eq = vi.fn()
const fromMock = vi.fn((_table: string) => ({
  upsert,
  delete: () => ({ eq }),
}))

vi.mock('../supabaseClient', () => ({ supabase: { from: fromMock } }))

const subscribeMock = vi.fn()
const getSubscriptionMock = vi.fn()
const unsubscribeMock = vi.fn()

beforeEach(() => {
  upsert.mockReset().mockResolvedValue({ error: null })
  eq.mockReset().mockResolvedValue({ error: null })
  fromMock.mockClear()
  subscribeMock.mockReset()
  getSubscriptionMock.mockReset()
  unsubscribeMock.mockReset().mockResolvedValue(true)

  // Set up window/navigator stubs for push support
  vi.stubGlobal('PushManager', class {})
  vi.stubGlobal('Notification', class {})
  Object.defineProperty(globalThis.navigator, 'serviceWorker', {
    configurable: true,
    value: {
      ready: Promise.resolve({
        pushManager: {
          subscribe: subscribeMock,
          getSubscription: getSubscriptionMock,
        },
      }),
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pushSupported', () => {
  it('returns true when serviceWorker, PushManager and Notification exist', async () => {
    const { pushSupported } = await import('./push')
    expect(pushSupported()).toBe(true)
  })

  it('returns false when PushManager is missing', async () => {
    delete (globalThis as any).PushManager
    const { pushSupported } = await import('./push')
    expect(pushSupported()).toBe(false)
  })
})

describe('subscribeToPush', () => {
  it('throws when push is not supported', async () => {
    delete (globalThis as any).Notification
    const { subscribeToPush } = await import('./push')
    await expect(subscribeToPush('user-1')).rejects.toThrow(/not supported/i)
  })

  it('force-resubscribes when an existing subscription is present', async () => {
    const existing = {
      endpoint: 'https://push/old',
      toJSON: () => ({ endpoint: 'https://push/old', keys: { p256dh: 'p', auth: 'a' } }),
      unsubscribe: unsubscribeMock,
    }
    getSubscriptionMock.mockResolvedValue(existing)
    subscribeMock.mockResolvedValue({
      endpoint: 'https://push/new',
      toJSON: () => ({ endpoint: 'https://push/new', keys: { p256dh: 'p2', auth: 'a2' } }),
    })

    const { subscribeToPush } = await import('./push')
    await subscribeToPush('user-1')

    expect(eq).toHaveBeenCalledWith('endpoint', 'https://push/old')
    expect(unsubscribeMock).toHaveBeenCalled()
    expect(subscribeMock).toHaveBeenCalledOnce()
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', endpoint: 'https://push/new', p256dh: 'p2', auth: 'a2' },
      { onConflict: 'endpoint' }
    )
  })

  it('creates a new subscription when none exists', async () => {
    getSubscriptionMock.mockResolvedValue(null)
    const fresh = {
      endpoint: 'https://push/new',
      toJSON: () => ({ endpoint: 'https://push/new', keys: { p256dh: 'k', auth: 'a' } }),
    }
    subscribeMock.mockResolvedValue(fresh)

    const { subscribeToPush } = await import('./push')
    await subscribeToPush('user-2')

    expect(subscribeMock).toHaveBeenCalledOnce()
    const opts = subscribeMock.mock.calls[0][0]
    expect(opts.userVisibleOnly).toBe(true)
    expect(opts.applicationServerKey).toBeInstanceOf(Uint8Array)
  })

  it('throws when keys are missing in subscription', async () => {
    getSubscriptionMock.mockResolvedValue(null)
    subscribeMock.mockResolvedValue({
      endpoint: 'x',
      toJSON: () => ({ endpoint: 'x', keys: {} }),
    })
    const { subscribeToPush } = await import('./push')
    await expect(subscribeToPush('user-3')).rejects.toThrow(/Invalid push subscription/i)
  })
})

describe('unsubscribeFromPush', () => {
  it('does nothing if push not supported', async () => {
    vi.stubGlobal('PushManager', undefined as any)
    const { unsubscribeFromPush } = await import('./push')
    await expect(unsubscribeFromPush()).resolves.toBeUndefined()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('does nothing if no current subscription', async () => {
    getSubscriptionMock.mockResolvedValue(null)
    const { unsubscribeFromPush } = await import('./push')
    await unsubscribeFromPush()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('deletes from db and revokes the subscription', async () => {
    getSubscriptionMock.mockResolvedValue({
      endpoint: 'https://push/abc',
      unsubscribe: unsubscribeMock,
    })
    const { unsubscribeFromPush } = await import('./push')
    await unsubscribeFromPush()
    expect(fromMock).toHaveBeenCalledWith('push_subscriptions')
    expect(eq).toHaveBeenCalledWith('endpoint', 'https://push/abc')
    expect(unsubscribeMock).toHaveBeenCalled()
  })
})
