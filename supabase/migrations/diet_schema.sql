-- =====================================================================
-- Diet module schema. Run in Supabase SQL Editor.
-- Idempotent (safe to re-run).
--
-- Two tables:
--   1. diet_meals     — the weekly plan: 7 days x 5 slots, one row per
--                       (user, day, slot). The unique index makes every
--                       write an upsert and makes "copy day" a single call.
--   2. meal_reminders — 5 rows per user, one push time per slot. Times are
--                       global (same every weekday), by design.
--
-- CHECK constraints mirror LIMITS in src/lib/validation.ts so a client
-- talking to Supabase directly cannot bypass them.
-- user_id is denormalised so RLS stays simple/fast (same as training_schema).
-- =====================================================================

-- 1. diet_meals ---------------------------------------------------------
-- day_of_week: 0=Sunday … 6=Saturday (matches JS Date.getDay() and routine_days).
create table if not exists public.diet_meals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  day_of_week  int  not null check (day_of_week between 0 and 6),
  slot         text not null check (slot in ('breakfast','snack1','lunch','snack2','dinner')),
  title        text not null check (char_length(title) between 1 and 100),
  ingredients  text[] not null default '{}'
               check (coalesce(array_length(ingredients, 1), 0) <= 30),
  protein_g    numeric(6,2) not null default 0 check (protein_g between 0 and 1000),
  fat_g        numeric(6,2) not null default 0 check (fat_g     between 0 and 1000),
  carbs_g      numeric(6,2) not null default 0 check (carbs_g   between 0 and 1000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists diet_meals_unique_slot
  on public.diet_meals(user_id, day_of_week, slot);
create index if not exists diet_meals_user_idx
  on public.diet_meals(user_id);

-- touch_updated_at() is created by training_schema.sql; define it here too so
-- this migration can run standalone.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists diet_meals_touch_updated_at on public.diet_meals;
create trigger diet_meals_touch_updated_at
  before update on public.diet_meals
  for each row execute function public.touch_updated_at();

-- 2. meal_reminders -----------------------------------------------------
create table if not exists public.meal_reminders (
  user_id    uuid not null references auth.users(id) on delete cascade,
  slot       text not null check (slot in ('breakfast','snack1','lunch','snack2','dinner')),
  hora       text not null default '08:00' check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  activa     boolean not null default false,
  timezone   text not null default 'UTC' check (char_length(timezone) between 1 and 50),
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

-- The send-push cron scans active reminders every minute.
create index if not exists meal_reminders_activa_idx
  on public.meal_reminders(activa) where activa = true;

drop trigger if exists meal_reminders_touch_updated_at on public.meal_reminders;
create trigger meal_reminders_touch_updated_at
  before update on public.meal_reminders
  for each row execute function public.touch_updated_at();

-- 3. RLS ----------------------------------------------------------------
-- Same policy on both tables: the row belongs to auth.uid().
do $$
declare t text;
begin
  for t in select unnest(array['diet_meals','meal_reminders'])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "users manage own %1$s" on public.%1$I;', t);
    execute format($f$
      create policy "users manage own %1$s"
        on public.%1$I for all
        using (user_id = auth.uid())
        with check (user_id = auth.uid())
    $f$, t);
  end loop;
end $$;
