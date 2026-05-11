import { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLParagraphElement> {}

/**
 * Small uppercase section label (e.g. "Stats", "Today's stack").
 * Mirrors the recurring `text-xs uppercase tracking-wider text-slate-500 font-medium` pattern.
 */
export default function Eyebrow({ className = '', ...rest }: Props) {
  const classes = [
    'text-xs uppercase tracking-wider text-slate-500 font-medium',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <p className={classes} {...rest} />
}
