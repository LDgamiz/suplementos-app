import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { initSentry, SentryErrorBoundary } from './lib/sentry'

initSentry()
registerSW({ immediate: true })

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center"
         style={{ background: '#0A0E1A' }}>
      <div className="max-w-sm">
        <h1 className="text-lg font-semibold text-slate-200 mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-500 mb-5">
          The app hit an unexpected error. Please refresh and try again. If it keeps happening,
          contact support.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold text-sm transition">
          Refresh
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SentryErrorBoundary>
  </StrictMode>
)
