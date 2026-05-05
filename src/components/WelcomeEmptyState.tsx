import { useEffect, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { supabase } from '../supabaseClient'
import type { SuplementoCat } from '../hooks/useSuplementos'

const SUGGESTIONS = ['Vitamin D', 'Creatine', 'Omega 3']

interface Props {
  onAdd: (suplemento_id: string, dosis: string) => void
}

export default function WelcomeEmptyState({ onAdd }: Props) {
  const [suggestions, setSuggestions] = useState<SuplementoCat[]>([])

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('suplementos_cat')
        .select('*')
        .in('name', SUGGESTIONS)
        .eq('status', 'approved')
      if (data) {
        const order = new Map(SUGGESTIONS.map((n, i) => [n, i]))
        setSuggestions(
          (data as SuplementoCat[]).sort(
            (a, b) => (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99)
          )
        )
      }
    })()
  }, [])

  return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 mb-3">
        <Sparkles size={22} className="text-brand" />
      </div>
      <h2 className="text-base font-semibold text-slate-200 mb-1">Welcome to StackForge</h2>
      <p className="text-sm text-slate-500 mb-5">
        Track what you take daily and watch your consistency grow.
      </p>

      {suggestions.length > 0 && (
        <>
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">
            Start with one of these
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {suggestions.map(s => (
              <button
                key={s.id}
                onClick={() => onAdd(s.id, `${s.recommended_dose} ${s.dose_unit}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand text-sm font-medium transition">
                <Plus size={14} />
                {s.name}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-slate-600">
        Or use the search below to add any supplement.
      </p>
    </div>
  )
}
