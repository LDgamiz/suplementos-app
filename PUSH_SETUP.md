# Push notifications setup

One-time setup so daily reminders work on mobile (Android + installed iOS PWA).

## 1. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

Save the two keys you get back (`Public Key` and `Private Key`).

## 2. Frontend env var

Add to `.env`:

```
VITE_VAPID_PUBLIC_KEY=<public key from step 1>
```

Restart `npm run dev` after adding it.

## 3. Supabase database

Open `supabase/migrations/push_notifications_setup.sql`, replace
`<PROJECT-REF>` and `<CRON-SECRET>` at the bottom, and run it in the
Supabase SQL Editor.

## 4. Edge Function secrets

```bash
supabase login
supabase link --project-ref <PROJECT-REF>

supabase secrets set VAPID_PUBLIC_KEY="<public key>"
supabase secrets set VAPID_PRIVATE_KEY="<private key>"
supabase secrets set VAPID_SUBJECT="mailto:ldgamiz12@gmail.com"
supabase secrets set CRON_SECRET="<any long random string>"
```

The same `CRON_SECRET` value goes into the SQL above.

## 5. Deploy the function

```bash
supabase functions deploy send-push --no-verify-jwt
```

`--no-verify-jwt` is fine because the function checks `CRON_SECRET` itself.

## 6. Test

- Log in to the app on a phone
- Android Chrome: just allow notifications and save the reminder
- iPhone: Share → **Add to Home Screen**, open from the home icon, then allow
  notifications and save the reminder
- Set the time 2–3 minutes ahead and wait. The cron runs every minute and
  the function sends a push to all users whose `hora` matches the current
  minute in their timezone.

## Meal reminders (Diet module)

The Diet module adds up to five more reminders per user on the same pipeline — no extra
cron job or Edge Function.

- Run `supabase/migrations/diet_schema.sql` once (creates `diet_meals` and `meal_reminders`).
- Redeploy the function after pulling these changes:
  `supabase functions deploy send-push --no-verify-jwt`
- Configure the times in the app under **Diet → bell icon** (`/diet/reminders`).

Per minute, `send-push` also scans `meal_reminders` where `activa = true`, keeps the rows
whose `hora` matches the current time in that user's timezone, resolves the user's **local
weekday**, and looks up `diet_meals` for that `(user, day_of_week, slot)`. The push is
titled with the slot ("Breakfast") and its body is the planned meal's title. **A slot with
nothing planned that day sends nothing.**

Each reminder carries its own notification `tag` (`meal-breakfast`, `meal-lunch`, …) so
several meal pushes can coexist instead of replacing one another. The supplement reminder
keeps the `daily-reminder` tag.

## How it works

- Browser subscribes to push (`PushManager.subscribe`) using the VAPID public
  key. The subscription (endpoint + keys) is saved in `push_subscriptions`.
- Reminder time/timezone is saved in `notif_settings`.
- `pg_cron` calls the `send-push` Edge Function every minute.
- The function looks up all `notif_settings` rows where `activa = true`
  and the current time in that user's timezone equals their `hora`,
  then pushes a notification to each of their subscriptions.
- The custom service worker (`src/sw.ts`) shows the notification.
