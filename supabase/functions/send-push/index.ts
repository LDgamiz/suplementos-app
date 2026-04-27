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

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('forbidden', { status: 403 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const now = new Date()

  const { data: settings, error: sErr } = await supabase
    .from('notif_settings')
    .select('user_id, hora, timezone')
    .eq('activa', true)

  if (sErr) return new Response(JSON.stringify({ error: sErr.message }), { status: 500 })
  if (!settings || settings.length === 0) {
    return new Response(JSON.stringify({ sent: 0, due: 0 }), { status: 200 })
  }

  const dueUsers = (settings as NotifSetting[])
    .filter(s => currentLocalHHMM(now, s.timezone) === s.hora)
    .map(s => s.user_id)

  if (dueUsers.length === 0) {
    return new Response(JSON.stringify({ sent: 0, due: 0 }), { status: 200 })
  }

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', dueUsers)

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, due: dueUsers.length }), { status: 200 })
  }

  const payload = JSON.stringify({
    title: 'My Supplements',
    body: 'Have you taken your supplements today?',
    url: '/'
  })

  const expired: string[] = []
  let sent = 0

  await Promise.allSettled((subs as PushSub[]).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
      sent++
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) expired.push(s.endpoint)
      else console.error('push error', code, err)
    }
  }))

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expired)
  }

  return new Response(
    JSON.stringify({ sent, due: dueUsers.length, removed: expired.length }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
})
