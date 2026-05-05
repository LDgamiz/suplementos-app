import { Link } from 'react-router-dom'
import { Pill } from 'lucide-react'
import { ReactNode } from 'react'

interface Props {
  title: string
  lastUpdated: string
  children: ReactNode
}

export default function LegalPage({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.06] bg-surface/30 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
            <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Pill size={14} className="text-brand" />
            </div>
            <span className="text-sm font-semibold">StackForge</span>
          </Link>
          <Link to="/" className="text-xs text-brand/80 hover:text-brand transition">Back to app</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">{title}</h1>
        <p className="text-xs text-slate-500 mb-8">Last updated: {lastUpdated}</p>
        <article className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-5 leading-relaxed">
          {children}
        </article>
        <p className="text-center text-[10px] text-slate-700 mt-12 tracking-wide">
          StackForge: Supplement Tracker
        </p>
      </main>
    </div>
  )
}
