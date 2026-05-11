/**
 * Streak milestone tiers — fitness-app gamification convention.
 * Returns null when the user hasn't reached the first tier yet (racha < 3),
 * so the UI can hide the badge until there's something to celebrate.
 */
export interface StreakTier {
  /** Inclusive lower bound that unlocks this tier. */
  threshold: number
  /** Short label, shown as uppercase eyebrow text. */
  label: string
}

const TIERS: StreakTier[] = [
  { threshold: 100, label: 'Legend' },
  { threshold: 30, label: 'Relentless' },
  { threshold: 14, label: 'Locked in' },
  { threshold: 7, label: 'On fire' },
  { threshold: 3, label: 'Warming up' },
]

export function streakTier(racha: number): StreakTier | null {
  for (const tier of TIERS) {
    if (racha >= tier.threshold) return tier
  }
  return null
}
