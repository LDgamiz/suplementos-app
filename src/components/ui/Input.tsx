import { InputHTMLAttributes, forwardRef } from 'react'

export type InputSize = 'sm' | 'md'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** `md` → form field on surface card (bg-surface-2). `sm` → inline edit in a card (bg-bg). */
  size?: InputSize
}

/**
 * Returns the field class string for the requested size. Use this on
 * `<select>` and `<textarea>` where you can't drop in `<Input>`.
 */
export function fieldClassName(size: InputSize = 'md'): string {
  if (size === 'sm') {
    return 'w-full px-3 py-2 rounded-xl bg-bg border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-sm'
  }
  return 'w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition'
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { size = 'md', className = '', ...rest },
  ref,
) {
  const classes = [fieldClassName(size), className].filter(Boolean).join(' ')
  return <input ref={ref} className={classes} {...rest} />
})

export default Input
