import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { applySWUpdate, SW_UPDATE_AVAILABLE_EVENT } from '../lib/swUpdate'
import { Button } from './ui'

export default function UpdateBanner() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    function onAvailable() { setAvailable(true) }
    window.addEventListener(SW_UPDATE_AVAILABLE_EVENT, onAvailable)
    return () => window.removeEventListener(SW_UPDATE_AVAILABLE_EVENT, onAvailable)
  }, [])

  if (!available) return null

  return (
    <div className="fixed z-40 top-3 left-3 right-3 md:left-auto md:right-4 md:top-4 md:max-w-sm">
      <div className="bg-surface border border-brand/30 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <RefreshCw size={14} className="text-brand" />
        </div>
        <p className="flex-1 text-sm text-slate-200">A new version is available.</p>
        <Button onClick={() => applySWUpdate()} size="sm" className="shrink-0">Refresh</Button>
      </div>
    </div>
  )
}
