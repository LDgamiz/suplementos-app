import { HTMLAttributes, forwardRef } from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardRadius = 'lg' | 'xl' | '2xl'

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  radius?: CardRadius
}

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const radiusClass: Record<CardRadius, string> = {
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-2xl',
}

const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { padding = 'md', radius = '2xl', className = '', ...rest },
  ref,
) {
  const classes = [
    'bg-surface border border-white/[0.08]',
    radiusClass[radius],
    paddingClass[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <div ref={ref} className={classes} {...rest} />
})

export default Card
