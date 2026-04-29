import { vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import type { Perfil } from '../../hooks/usePerfil'
import type { Suplemento, SuplementoCat } from '../../hooks/useSuplementos'

export function makeSession(overrides: Partial<Session['user']> = {}): Session {
  return {
    user: {
      id: 'user-1',
      email: 'test@test.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-01-01',
      ...overrides,
    } as Session['user'],
    access_token: 'fake-token',
    refresh_token: 'fake-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  }
}

export function makePerfil(overrides: Partial<Perfil> = {}): Perfil {
  return {
    id: 'perfil-1',
    user_id: 'user-1',
    username: null,
    full_name: null,
    birth_date: null,
    weight_kg: null,
    height_cm: null,
    gender: null,
    avatar_url: null,
    bio: null,
    country: null,
    goal: null,
    activity: null,
    role: 'user',
    created_at: '2026-01-01',
    ...overrides,
  }
}

export function makeSuplementoCat(overrides: Partial<SuplementoCat> = {}): SuplementoCat {
  return {
    id: 'cat-1',
    name: 'Vitamin D',
    category: 'vitamin',
    recommended_dose: 1000,
    dose_unit: 'IU',
    status: 'approved',
    created_by: null,
    ...overrides,
  }
}

export function makeSuplemento(overrides: Partial<Suplemento> = {}): Suplemento {
  return {
    id: 1,
    suplemento_id: 'cat-1',
    dosis: '500mg',
    tomado: false,
    publico: false,
    fecha: '2026-04-28',
    user_id: 'user-1',
    created_at: '2026-04-28T00:00:00Z',
    suplementos_cat: { name: 'Vitamin D', category: 'vitamin' },
    ...overrides,
  }
}

/**
 * Builds a chainable thenable mock for Supabase queries.
 * Every chain method returns the same builder so calls like
 * `from(...).select(...).eq(...).order(...)` all resolve to the same value.
 */
type Result<T = unknown> = { data: T; error: { message: string; code?: string } | null }

export function makeQueryBuilder<T = unknown>(result: Result<T>) {
  const builder: any = {}
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is',
    'order', 'limit', 'range', 'match', 'contains', 'filter',
  ]
  chainMethods.forEach(m => { builder[m] = vi.fn().mockReturnValue(builder) })
  builder.single = vi.fn().mockResolvedValue(result)
  builder.maybeSingle = vi.fn().mockResolvedValue(result)
  builder.then = (resolve: (r: Result<T>) => void) => Promise.resolve(result).then(resolve)
  return builder
}

export interface SupabaseMockOptions {
  session?: Session | null
  fromResults?: Record<string, Result>
  uploadError?: { message: string } | null
  publicUrl?: string
}

export function createSupabaseMock(opts: SupabaseMockOptions = {}) {
  const session = opts.session ?? null
  const fromResults = opts.fromResults ?? {}
  const subscriptionUnsub = vi.fn()

  const fromMock = vi.fn((table: string) =>
    makeQueryBuilder(fromResults[table] ?? { data: [], error: null })
  )

  return {
    from: fromMock,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
      onAuthStateChange: vi.fn((cb?: (e: string, s: Session | null) => void) => {
        if (cb) cb('INITIAL_SESSION', session)
        return { data: { subscription: { unsubscribe: subscriptionUnsub } } }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: opts.uploadError ?? null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: opts.publicUrl ?? 'https://cdn.test/avatar.jpg' } })),
      })),
    },
    _internals: { subscriptionUnsub },
  }
}
