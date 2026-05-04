-- =====================================================================
-- Training module schema. Run in Supabase SQL Editor.
-- Idempotent (safe to re-run).
--
-- Three layers, kept separate on purpose:
--   1. routines + routine_days + routine_exercises  (template)
--   2. workouts + workout_exercises                 (session, snapshot of template)
--   3. workout_sets                                 (real reps/weight)
--
-- user_id is denormalised on every table so RLS stays simple/fast.
-- =====================================================================

-- 1. routines -----------------------------------------------------------
create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists routines_user_idx on public.routines(user_id);
-- only one active routine per user (partial unique)
create unique index if not exists routines_one_active_per_user
  on public.routines(user_id) where is_active = true;

-- updated_at auto-touch
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists routines_touch_updated_at on public.routines;
create trigger routines_touch_updated_at
  before update on public.routines
  for each row execute function public.touch_updated_at();

-- 2. routine_days -------------------------------------------------------
-- 0=Sunday, 6=Saturday (matches JS Date.getDay()).
create table if not exists public.routine_days (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references public.routines(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  day_of_week  int  not null check (day_of_week between 0 and 6),
  name         text,
  created_at   timestamptz not null default now()
);
create unique index if not exists routine_days_unique_dow
  on public.routine_days(routine_id, day_of_week);
create index if not exists routine_days_user_idx on public.routine_days(user_id);

-- 3. routine_exercises --------------------------------------------------
create table if not exists public.routine_exercises (
  id              uuid primary key default gen_random_uuid(),
  routine_day_id  uuid not null references public.routine_days(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  sets            int  not null check (sets between 1 and 20),
  rep_range       text,
  order_index     int  not null default 0,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists routine_exercises_day_order_idx
  on public.routine_exercises(routine_day_id, order_index);
create index if not exists routine_exercises_user_idx
  on public.routine_exercises(user_id);

-- 4. workouts -----------------------------------------------------------
-- Snapshot of a session. routine_id can become NULL if the routine is
-- deleted later — we keep history.
create table if not exists public.workouts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  routine_id         uuid references public.routines(id) on delete set null,
  routine_day_name   text,
  fecha              date not null default current_date,
  status             text not null default 'in_progress'
                     check (status in ('in_progress','completed','abandoned')),
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  notes              text,
  created_at         timestamptz not null default now()
);
create index if not exists workouts_user_fecha_idx
  on public.workouts(user_id, fecha desc);
create index if not exists workouts_user_status_idx
  on public.workouts(user_id, status);

-- 5. workout_exercises --------------------------------------------------
create table if not exists public.workout_exercises (
  id                    uuid primary key default gen_random_uuid(),
  workout_id            uuid not null references public.workouts(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  routine_exercise_id   uuid references public.routine_exercises(id) on delete set null,
  name                  text not null,
  rep_range             text,
  order_index           int  not null default 0,
  created_at            timestamptz not null default now()
);
create index if not exists workout_exercises_workout_idx
  on public.workout_exercises(workout_id, order_index);
create index if not exists workout_exercises_user_idx
  on public.workout_exercises(user_id);

-- 6. workout_sets -------------------------------------------------------
create table if not exists public.workout_sets (
  id                     uuid primary key default gen_random_uuid(),
  workout_exercise_id    uuid not null references public.workout_exercises(id) on delete cascade,
  user_id                uuid not null references auth.users(id) on delete cascade,
  set_number             int  not null check (set_number > 0),
  reps                   int  check (reps is null or reps >= 0),
  weight                 numeric(6,2) check (weight is null or weight >= 0),
  completed              boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create unique index if not exists workout_sets_unique_number
  on public.workout_sets(workout_exercise_id, set_number);
create index if not exists workout_sets_user_idx
  on public.workout_sets(user_id);

drop trigger if exists workout_sets_touch_updated_at on public.workout_sets;
create trigger workout_sets_touch_updated_at
  before update on public.workout_sets
  for each row execute function public.touch_updated_at();

-- 7. RLS ---------------------------------------------------------------
-- Same simple policy on every table: row belongs to auth.uid().
do $$
declare t text;
begin
  for t in select unnest(array[
    'routines','routine_days','routine_exercises',
    'workouts','workout_exercises','workout_sets'
  ])
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
