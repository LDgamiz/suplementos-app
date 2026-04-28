import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('VITE_SUPABASE_KEY', 'test-anon-key')
vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BHQz_test_vapid_key_padding_to_reach_64_chars_minimum_aaaaaaaaa')
vi.stubEnv('VITE_PAYPAL_HANDLE', 'test-handle')

if (!('clipboard' in navigator)) {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
}
