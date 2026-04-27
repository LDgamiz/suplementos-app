-- =====================================================================
-- Push notifications setup
-- Run this once in Supabase SQL Editor.
-- Replace <PROJECT-REF>, <SERVICE-ROLE-KEY> and <CRON-SECRET> at the bottom
-- before executing the cron section.
-- =====================================================================

-- 1. Tables ------------------------------------------------------------

create table if not exists public.notif_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  hora       text not null default '08:00',
  activa     boolean not null default false,
  timezone   text not null default 'UTC',
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

-- 2. Row Level Security ------------------------------------------------

alter table public.notif_settings     enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "users manage own notif_settings"     on public.notif_settings;
drop policy if exists "users manage own push_subscriptions" on public.push_subscriptions;

create policy "users manage own notif_settings"
  on public.notif_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own push_subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Cron ---------------------------------------------------------------
-- Requires `pg_cron` and `pg_net` extensions enabled
-- (Database -> Extensions in Supabase dashboard).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace placeholders before running:
--   <PROJECT-REF>     your supabase project ref (e.g. abcd1234)
--   <CRON-SECRET>     same value you set with `supabase functions secrets set CRON_SECRET=...`

select cron.schedule(
  'supplement-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT-REF>.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON-SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To remove the schedule later:
--   select cron.unschedule('supplement-reminders');
