import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input, fieldClassName } from '../../components/ui'
import {
  DietMeal, MealSlot, MealInput, slotLabel, formatIngredients,
} from '../../lib/diet'

interface Props {
  slot: MealSlot
  /** The meal being edited, or null when filling an empty slot. */
  meal: DietMeal | null
  saving: boolean
  onSave: (input: MealInput) => void
  onDelete: () => void
  onCancel: () => void
}

const macroFields = [
  { key: 'protein', label: 'Protein', accent: 'text-brand' },
  { key: 'fat', label: 'Fat', accent: 'text-macro-fat' },
  { key: 'carbs', label: 'Carbs', accent: 'text-warn' },
] as const

export default function MealForm({ slot, meal, saving, onSave, onDelete, onCancel }: Props) {
  const [title, setTitle] = useState(meal?.title ?? '')
  const [ingredientsText, setIngredientsText] = useState(
    formatIngredients(meal?.ingredients ?? [])
  )
  const [macros, setMacros] = useState({
    protein: meal ? String(meal.protein_g) : '',
    fat: meal ? String(meal.fat_g) : '',
    carbs: meal ? String(meal.carbs_g) : '',
  })

  const label = slotLabel(slot)
  const titleId = `meal-title-${slot}`
  const ingredientsId = `meal-ingredients-${slot}`

  function submit() {
    onSave({
      title,
      ingredientsText,
      protein: macros.protein || 0,
      fat: macros.fat || 0,
      carbs: macros.carbs || 0,
    })
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-brand/20 p-4 space-y-3">
      <div>
        <label htmlFor={titleId} className="block text-xs text-slate-400 mb-1.5">
          What are you eating
        </label>
        <Input
          id={titleId}
          size="sm"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={`e.g. ${label === 'Breakfast' ? 'Oats with protein' : 'Chicken and rice'}`}
          autoFocus
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor={ingredientsId} className="block text-xs text-slate-400 mb-1.5">
          Ingredients — one per line
        </label>
        <textarea
          id={ingredientsId}
          value={ingredientsText}
          onChange={e => setIngredientsText(e.target.value)}
          rows={4}
          placeholder={'60g oats\n1 scoop whey\n1 banana'}
          className={`${fieldClassName('sm')} resize-y leading-relaxed`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {macroFields.map(f => {
          const id = `meal-${f.key}-${slot}`
          return (
            <div key={f.key}>
              <label htmlFor={id} className={`block text-[11px] font-medium mb-1.5 ${f.accent}`}>
                {f.label} (g)
              </label>
              <Input
                id={id}
                size="sm"
                type="number"
                inputMode="decimal"
                min={0}
                max={1000}
                value={macros[f.key]}
                onChange={e => setMacros({ ...macros, [f.key]: e.target.value })}
                placeholder="0"
                className="tabular-nums"
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        {meal && (
          <button
            onClick={onDelete}
            aria-label={`Delete ${label}`}
            className="p-2 rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-400/10 transition shrink-0">
            <Trash2 size={15} />
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : 'Save meal'}
          </Button>
        </div>
      </div>
    </div>
  )
}
