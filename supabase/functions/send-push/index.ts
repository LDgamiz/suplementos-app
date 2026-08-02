// Supabase Edge Function: send-push
// Triggered by pg_cron every minute. Sends a web push to users whose
// notif_settings.hora matches the current minute in their timezone.
//
// Required env (set with: supabase functions secrets set KEY=value):
//   SUPABASE_URL              (auto-provided)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT             (e.g. mailto:you@example.com)
//   CRON_SECRET               (shared secret; pg_cron must send it as X-Cron-Secret header)

import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'
const CRON_SECRET = Deno.env.get('CRON_SECRET')

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

interface NotifSetting {
  user_id: string
  hora: string
  timezone: string
}

interface PushSub {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

type MealSlot = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner'

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  snack1: 'Snack 1',
  lunch: 'Lunch',
  snack2: 'Snack 2',
  dinner: 'Dinner',
}

interface MealReminder {
  user_id: string
  slot: MealSlot
  hora: string
  timezone: string
}

interface DietMeal {
  user_id: string
  day_of_week: number
  slot: MealSlot
  title: string
}

/** One notification aimed at one user; fanned out to their devices below. */
interface Delivery {
  user_id: string
  payload: string
}

function currentLocalHHMM(now: Date, timezone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now)
    const hh = parts.find(p => p.type === 'hour')?.value ?? '00'
    const mm = parts.find(p => p.type === 'minute')?.value ?? '00'
    return `${hh}:${mm}`
  } catch {
    return null
  }
}

const DOW: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

/** The user's local day of week, 0=Sunday, matching diet_meals.day_of_week. */
function currentLocalDow(now: Date, timezone: string): number | null {
  try {
    const short = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).format(now)
    return DOW[short] ?? null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('forbidden', { status: 403 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const now = new Date()
  const deliveries: Delivery[] = []

  // --- 1. Supplement reminder (one per user) ---------------------------
  const { data: settings, error: sErr } = await supabase
    .from('notif_settings')
    .select('user_id, hora, timezone')
    .eq('activa', true)

  if (sErr) return new Response(JSON.stringify({ error: sErr.message }), { status: 500 })

  for (const s of (settings ?? []) as NotifSetting[]) {
    if (currentLocalHHMM(now, s.timezone) !== s.hora) continue
    deliveries.push({
      user_id: s.user_id,
      payload: JSON.stringify({
        title: 'StackForge',
        body: 'Have you taken your supplements today?',
        url: '/',
        tag: 'daily-reminder',
      }),
    })
  }

  // --- 2. Meal reminders (up to five per user) -------------------------
  // Each due reminder is answered with the meal planned for that slot on the
  // user's local weekday. Slots with nothing planned stay silent.
  const { data: mealSettings, error: mErr } = await supabase
    .from('meal_reminders')
    .select('user_id, slot, hora, timezone')
    .eq('activa', true)

  if (mErr) return new Response(JSON.stringify({ error: mErr.message }), { status: 500 })

  const dueMeals = ((mealSettings ?? []) as MealReminder[])
    .map(r => ({ r, dow: currentLocalDow(now, r.timezone) }))
    .filter(({ r, dow }) => dow !== null && currentLocalHHMM(now, r.timezone) === r.hora)

  if (dueMeals.length > 0) {
    const { data: meals } = await supabase
      .from('diet_meals')
      .select('user_id, day_of_week, slot, title')
      .in('user_id', [...new Set(dueMeals.map(({ r }) => r.user_id))])

    const byKey = new Map<string, string>()
    for (const m of (meals ?? []) as DietMeal[]) {
      byKey.set(`${m.user_id}|${m.day_of_week}|${m.slot}`, m.title)
    }

    for (const { r, dow } of dueMeals) {
      const title = byKey.get(`${r.user_id}|${dow}|${r.slot}`)
      if (!title) continue // nothing planned for this slot today
      deliveries.push({
        user_id: r.user_id,
        payload: JSON.stringify({
          title: SLOT_LABEL[r.slot] ?? 'Meal',
          body: title,
          url: '/diet',
          tag: `meal-${r.slot}`,
        }),
      })
    }
  }

  if (deliveries.length === 0) {
    return new Response(JSON.stringify({ sent: 0, due: 0 }), { status: 200 })
  }

  // --- 3. Fan out to every device of each targeted user ----------------
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', [...new Set(deliveries.map(d => d.user_id))])

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, due: deliveries.length }), { status: 200 })
  }

  const subsByUser = new Map<string, PushSub[]>()
  for (const s of subs as PushSub[]) {
    const list = subsByUser.get(s.user_id) ?? []
    list.push(s)
    subsByUser.set(s.user_id, list)
  }

  const expired: string[] = []
  let sent = 0

  const sends = deliveries.flatMap(d =>
    (subsByUser.get(d.user_id) ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          d.payload
        )
        sent++
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) expired.push(s.endpoint)
        else console.error('push error', code, err)
      }
    })
  )
  await Promise.allSettled(sends)

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', [...new Set(expired)])
  }

  return new Response(
    JSON.stringify({ sent, due: deliveries.length, removed: expired.length }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
})
