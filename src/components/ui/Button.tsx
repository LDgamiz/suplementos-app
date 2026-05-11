import { ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed'

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-lg text-xs',
  md: 'px-4 py-2.5 rounded-xl text-sm',
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand hover:bg-brand-dark text-bg',
  secondary:
    'bg-surface-2 border border-white/10 text-slate-300 hover:text-slate-100 hover:border-white/20',
  ghost:
    'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent',
  danger:
    'bg-surface-2 border border-white/10 text-rose-400/80 hover:text-rose-400 hover:border-rose-400/30',
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, className = '', type = 'button', ...rest },
  ref,
) {
  const classes = [
    base,
    sizeClass[size],
    variantClass[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <button ref={ref} type={type} className={classes} {...rest} />
})

export default Button
