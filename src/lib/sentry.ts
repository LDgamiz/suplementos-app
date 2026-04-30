import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initSentry(): void {
  if (!DSN) return
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
  })
}

export function setSentryUser(userId: string | null): void {
  if (!DSN) return
  if (userId) Sentry.setUser({ id: userId })
  else Sentry.setUser(null)
}

export const SentryErrorBoundary = Sentry.ErrorBoundary
