import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmTone?: 'danger' | 'brand'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'brand',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const confirmClass =
    confirmTone === 'danger'
      ? 'bg-rose-500 hover:bg-rose-600 text-white'
      : 'bg-brand hover:bg-brand-dark text-bg'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="w-full max-w-sm bg-surface border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
        <h2 id="confirm-modal-title" className="text-base font-semibold text-slate-100 mb-2">
          {title}
        </h2>
        {body && <p className="text-sm text-slate-400 mb-5">{body}</p>}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-xl bg-surface-2 border border-white/10 text-slate-300 hover:text-slate-100 hover:border-white/20 transition">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
