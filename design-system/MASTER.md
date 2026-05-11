# StackForge — Design System Master

Single source of truth for visual decisions in StackForge: Fitness Tracker. Before building a new page or component, read this file. If a deviation is needed for a specific page, document it as a Markdown file inside `design-system/pages/<page-name>.md`.

## Brand

| Field | Value |
|---|---|
| Name | **StackForge** |
| Subtitle | Fitness Tracker |
| Tagline | Train · Stack · Repeat |
| Mark | `public/Logo.png` (SF monogram, 180×180 PNG, on dark surface) |
| Voice | Imperative, athletic, dark-mode-first. Avoid SaaS-neutral phrasing. |

**When to use the logo image vs the Pill icon:**
- `<img src="/Logo.png">` — every wordmark/brand surface (SideMenu header, Auth wordmark, ResetPassword header, Onboarding hero).
- Lucide `Pill` icon — *only* as the section icon for Supplements (in nav, in card headers). Never as the brand mark.
- Lucide `Dumbbell` icon — section icon for Training.

## Color tokens

All tokens are declared in `src/index.css` under `@theme`. Reference them via Tailwind utilities (e.g., `bg-bg`, `text-warn`). Avoid hardcoded hex in components.

| Token | Hex | Used for |
|---|---|---|
| `--color-bg` | `#0A0E1A` | Page background, button text on brand fills, input bg inside cards |
| `--color-elev-1` (`--color-surface`) | `#0F172A` | Card surface, side menu surface |
| `--color-elev-2` (`--color-surface-2`) | `#1E293B` | Input bg on standalone forms, chips, nested rows |
| `--color-elev-3` | `#2A3447` | Modals / sheets (reserved for future use) |
| `--color-brand` | `#00C896` | Primary CTA, active nav, focus rings, success |
| `--color-brand-dark` | `#009E78` | Primary hover |
| `--color-success` | `#00C896` | Alias of brand for success states |
| `--color-warn` | `#F59E0B` | Warnings, pending badges, neutral alerts |
| `--color-danger` | `#FB7185` | Destructive actions, error text |
| `--color-streak` | `#F59E0B` | Streak Flame + streak number (alias of warn) |
| `--color-pr` | `#C6F432` | Reserved: PR / Top-set badges (gated until backend logic ships) |

**Contrast rule:** all foreground/background pairs must meet WCAG AA (4.5:1 normal text). Verified: brand on bg = 8.6:1, slate-200 on bg = 13.4:1, warn on bg = 10.7:1, pr on bg = 17.1:1.

## Typography

```css
--font-sans:    'Inter', system-ui, sans-serif;
--font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;
```

- `font-sans` (Inter) — body, UI, labels, paragraphs.
- `font-display` (Space Grotesk) — page H1s, brand wordmark, **all large numbers** (stats hero, streak count). Always pair with `tabular-nums` on numbers to prevent layout shift.

**Type roles in use:**
- Display number: `font-display text-2xl font-bold tabular-nums`
- Page H1: `font-display text-xl font-bold tracking-tight` (`text-2xl` on hero contexts like Onboarding, `text-3xl` on auth wordmark)
- Section H2: `text-base font-semibold text-slate-200` (Inter)
- Eyebrow label: use `<Eyebrow>` (resolves to `text-xs uppercase tracking-wider text-slate-500 font-medium`)
- Body: `text-sm text-slate-300` (or `slate-400` for secondary)
- Caption: `text-xs text-slate-500`

## Radius and elevation tokens

```css
--radius-sm: 0.5rem;   /* 8px  — chips, badges */
--radius-md: 0.75rem;  /* 12px — buttons */
--radius-lg: 1rem;     /* 16px — small cards */
--radius-xl: 1.5rem;   /* 24px — hero / sheet */

--shadow-elev-1: 0 1px 2px rgb(0 0 0 / 0.3);
--shadow-elev-2: 0 8px 24px rgb(0 0 0 / 0.4);
--shadow-elev-3: 0 20px 50px rgb(0 0 0 / 0.6);
```

**Radius convention by element:**
- Buttons → `rounded-lg` (sm) / `rounded-xl` (md) — handled by `<Button>`.
- Cards → `rounded-2xl` — handled by `<Card>` (default `radius="2xl"`).
- Hero icons / brand marks → `rounded-2xl`.
- Chips / pills → `rounded-lg`.

## Component primitives

Located in `src/components/ui/`. Barrel export from `src/components/ui/index.ts`. **Always reach for these before writing raw Tailwind for buttons/cards/inputs/eyebrows.**

### `<Button>`

```tsx
<Button variant="primary" size="md" fullWidth onClick={...}>Label</Button>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `primary` / `secondary` / `ghost` / `danger` | `primary` |
| `size` | `sm` / `md` | `md` |
| `fullWidth` | boolean | `false` |

- **`primary`** — `bg-brand hover:bg-brand-dark text-bg`. Main CTA per screen (one per screen).
- **`secondary`** — `bg-surface-2 border border-white/10 text-slate-300`. Cancel / dismiss / secondary action.
- **`ghost`** — text-only with subtle hover. Use for low-emphasis actions in dense areas.
- **`danger`** — `bg-surface-2 border-white/10 text-rose-400/80 hover:border-rose-400/30`. Subtle destructive (Discard, Delete). For solid-red destructive primary (`ConfirmModal` confirm button on `danger` tone), `<Button>` doesn't fit — keep raw.

Renders `<button type="button">`. **Not polymorphic** — for `<Link>` / `<a>` styled as button, keep the raw anchor.

### `<Card>`

```tsx
<Card padding="md" radius="2xl" className="...">{children}</Card>
```

| Prop | Values | Default |
|---|---|---|
| `padding` | `none` / `sm` (`p-4`) / `md` (`p-5`) / `lg` (`p-6`) | `md` |
| `radius` | `lg` / `xl` / `2xl` | `2xl` |

Renders a `<div>` with `bg-surface border border-white/[0.08]`. Pass `padding="none"` when wrapping a table/list that handles its own internal spacing.

### `<Input>` + `fieldClassName`

```tsx
<Input size="md" value={...} onChange={...} placeholder="..." />
<select className={fieldClassName('sm')}>...</select>
```

| Prop | Values | Default |
|---|---|---|
| `size` | `sm` (compact, `bg-bg`, `text-sm`) / `md` (standard, `bg-surface-2`) | `md` |

**Size correlates with context:**
- `md` — form fields on a card surface (Auth, Profile, Onboarding inputs).
- `sm` — inline edit in dense rows / tables / nested cards (RoutineEditor, SupplementoItem edit, AgregarSuplemento sub-form, AdminCatalog).

For `<select>` and `<textarea>` where `<Input>` doesn't fit, use the `fieldClassName(size)` helper to get the same class string.

### `<Eyebrow>`

```tsx
<Eyebrow className="mb-1">Streak</Eyebrow>
```

Renders `<p>` with `text-xs uppercase tracking-wider text-slate-500 font-medium`. Use for section labels above cards/stats. Don't use for h2 semantic headers — keep `<h2>` raw if hierarchy matters for screen readers.

## Patterns

### Stats hero number

```tsx
<span className="font-display text-2xl font-bold text-white tabular-nums">
  {value}
  <span className="text-slate-600 text-base font-normal">/{total}</span>
</span>
```

Always `font-display` + `tabular-nums`. Secondary digits (denominator) in `slate-600 text-base font-normal`.

### Streak tier badge

```tsx
import { streakTier } from '../lib/streakTier'

const tier = streakTier(racha)
// ...
{tier && (
  <p className="text-[10px] uppercase tracking-wider text-streak/80 font-bold mt-1">
    {tier.label}
  </p>
)}
```

Tiers: 3 → "Warming up", 7 → "On fire", 14 → "Locked in", 30 → "Relentless", 100 → "Legend". Returns `null` below 3 so the UI stays clean until there's something to celebrate.

### Active nav item

```tsx
'bg-brand/10 text-brand border border-brand/20'
```

Used identically in SideMenu, BottomNav (text-only), and "Active" routine badge. Don't drift this pattern.

### Pending / warning chip

```tsx
'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/10 text-warn border border-warn/20'
```

### Glass header (mobile)

```tsx
'border-b border-white/[0.06] bg-surface/30 backdrop-blur sticky top-0 z-20'
```

## Conventions

- **Dark-first, no light mode.** Don't introduce light variants without an explicit decision — the market (Strong, Hevy, Whoop) is dark-first and the brand mark relies on a dark backdrop.
- **One primary CTA per screen.** Use `<Button variant="primary">` once; everything else is `secondary` / `ghost` / `danger`.
- **Numbers use `font-display` + `tabular-nums`.** Always. Especially anything that updates live (timers, counts, percentages, streaks).
- **`Pill` is a section icon, not a brand mark.** Brand surfaces use `/Logo.png` via `<img>`.
- **Empty states use imperative copy.** "Build today's stack" / "Forge your weekly routine" — never "No items yet."
- **A11y baseline:** every input has a visible label or aria-label, every icon-only button has aria-label, focus rings preserved (`focus:ring-1 focus:ring-brand/30`).
- **Mojibake check before commit:** run `grep -r 'Â\|â€\|Ã[±¡©­³º—]' src` and verify 0 hits if you touched files with multibyte chars (· × — ñ á etc.). Windows PowerShell's default codepage corrupts UTF-8.

## Out of scope (deferred)

- Light mode pairing.
- `--color-pr` activation (waiting for backend PR-detection logic in `WorkoutTracker`).
- Charts palette tokenization (waiting for training metrics: volume, RPE).
- `<Button as="a">` polymorphism — currently anchors styled as buttons are kept raw.

## Page-specific overrides

If a page needs to deviate from this master (different padding, different palette), document it in `design-system/pages/<page-name>.md` and reference both files when building that page.
