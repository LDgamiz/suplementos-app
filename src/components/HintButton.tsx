import { useEffect, useId, useRef, useState } from 'react'
import { Info, X } from 'lucide-react'

interface Props {
  text: string
  label?: string
}

export default function HintButton({ text, label = 'Hint' }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-controls={popoverId}
        className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition">
        <Info size={14} />
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={label}
          className="absolute z-30 right-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-surface border border-white/[0.08] rounded-xl shadow-2xl p-3">
          <div className="flex items-start gap-2">
            <p className="text-xs text-slate-300 leading-relaxed flex-1">{text}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close hint"
              className="p-0.5 rounded text-slate-500 hover:text-slate-200 transition shrink-0">
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
