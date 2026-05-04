-- =====================================================================
-- Training schema audit (read-only). Run after training_schema.sql.
-- Expected: 6 tables present, RLS on all, FKs to auth.users with CASCADE,
-- the partial unique index for one-active-routine-per-user, and the
-- updated_at trigger on routines/workout_sets.
-- =====================================================================

-- 1. Tables exist + RLS enabled. Expected: 6 rows, all relrowsecurity=true.
select relname, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'routines','routine_days','routine_exercises',
    'workouts','workout_exercises','workout_sets'
  )
order by relname;

-- 2. Policies. Expected: one "users manage own <table>" per table.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'routines','routine_days','routine_exercises',
    'workouts','workout_exercises','workout_sets'
  )
order by tablename;

-- 3. FKs and ON DELETE behaviour. Expected: every user_id -> auth.users
--    is CASCADE; routines.id -> workouts is SET NULL.
select
  tc.table_name,
  kcu.column_name,
  ccu.table_schema as foreign_schema,
  ccu.table_name   as foreign_table,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name and tc.table_schema = rc.constraint_schema
join information_schema.constraint_column_usage ccu
  on rc.unique_constraint_name = ccu.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'routines','routine_days','routine_exercises',
    'workouts','workout_exercises','workout_sets'
  )
order by tc.table_name, kcu.column_name;

-- 4. The partial unique that enforces one active routine per user.
--    Expected: 1 row with predicate "is_active = true".
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'routines'
  and indexname = 'routines_one_active_per_user';

-- 5. updated_at triggers. Expected: 2 rows (routines, workout_sets).
select tgname, tgrelid::regclass as table_name
from pg_trigger
where tgname in ('routines_touch_updated_at', 'workout_sets_touch_updated_at')
  and not tgisinternal;
