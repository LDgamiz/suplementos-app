import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { initSentry, SentryErrorBoundary } from './lib/sentry'
import { registerSWUpdate } from './lib/swUpdate'
import { Button } from './components/ui'

initSentry()
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    registerSWUpdate(updateSW)
  },
})

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
        <Button onClick={() => window.location.reload()}>Refresh</Button>
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
