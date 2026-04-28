import { Heart, Coffee, ExternalLink } from 'lucide-react'

const PAYPAL_HANDLE = import.meta.env.VITE_PAYPAL_HANDLE

export default function SupportUs() {
  const url = `https://www.paypal.com/paypalme/${PAYPAL_HANDLE}`

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <Heart size={18} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Support Us</h1>
      </div>

      <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 mb-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 mb-4">
          <Coffee size={28} className="text-brand" />
        </div>
        <h2 className="text-lg font-semibold text-slate-200 mb-2">Help keep this app running</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          My Supplements is built and maintained by a small team. If it helps you stay
          consistent with your stack, consider buying us a coffee — it covers servers,
          push notifications and lets us ship new features faster.
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3.5 px-4 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-xl transition text-center mb-3">
        <span className="flex items-center justify-center gap-2">
          Donate via PayPal
          <ExternalLink size={15} />
        </span>
      </a>

      <p className="text-xs text-slate-500 text-center">
        Donations are voluntary and non-refundable. Thank you 💚
      </p>
    </>
  )
}
