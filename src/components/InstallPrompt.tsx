import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa-install-dismissed'

export default function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  if (!evt || dismissed) return null

  async function install() {
    if (!evt) return
    await evt.prompt()
    const { outcome } = await evt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') setEvt(null)
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div className="fixed z-40 bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-surface border border-brand/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <Download size={16} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100">Install StackForge</p>
          <p className="text-xs text-slate-500">Get the app on your home screen.</p>
        </div>
        <button
          onClick={install}
          className="px-3 py-1.5 text-xs rounded-lg bg-brand hover:bg-brand-dark text-bg font-bold transition shrink-0">
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
