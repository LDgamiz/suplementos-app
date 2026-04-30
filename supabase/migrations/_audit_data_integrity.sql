-- =====================================================================
-- Data integrity audit (read-only). Run in Supabase SQL Editor and share
-- the results to plan the integrity migration.
-- =====================================================================

-- 1. Foreign keys on app tables and their ON DELETE behaviour.
--    Expected:
--      - perfiles.user_id           -> auth.users     CASCADE
--      - suplementos.user_id        -> auth.users     CASCADE
--      - suplementos.suplemento_id  -> suplementos_cat  CASCADE  (or RESTRICT, see audit)
--      - rutinas.user_id            -> auth.users     CASCADE
--      - rutina_suplementos.rutina_id -> rutinas      CASCADE   (likely missing)
--      - notif_settings.user_id     -> auth.users     CASCADE
--      - push_subscriptions.user_id -> auth.users     CASCADE
--      - suplementos_cat.created_by -> auth.users     SET NULL
select
  tc.table_name,
  kcu.column_name,
  ccu.table_schema as foreign_schema,
  ccu.table_name   as foreign_table,
  ccu.column_name  as foreign_column,
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
    'perfiles','suplementos','rutinas','rutina_suplementos',
    'notif_settings','push_subscriptions','suplementos_cat'
  )
order by tc.table_name, kcu.column_name;

-- 2. CHECK constraints on perfiles. Expected: maybe 0 today; we'll add some.
select conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.perfiles'::regclass and contype = 'c';

-- 3. Spot orphans: rutina_suplementos rows whose rutina_id no longer exists.
--    If this returns > 0 we need to clean before adding a strict FK.
select count(*) as orphan_rutina_suplementos
from public.rutina_suplementos rs
where not exists (select 1 from public.rutinas r where r.id = rs.rutina_id);

-- 4. Spot orphans on suplementos.user_id pointing to deleted auth users.
select count(*) as orphan_suplementos_users
from public.suplementos s
where not exists (select 1 from auth.users u where u.id = s.user_id);

-- 5. Out-of-range values today (so we know if a CHECK would reject existing rows).
select
  count(*) filter (where weight_kg is not null and (weight_kg < 20 or weight_kg > 400)) as bad_weight,
  count(*) filter (where height_cm is not null and (height_cm < 50 or height_cm > 250)) as bad_height,
  count(*) filter (where birth_date is not null and (birth_date > current_date or birth_date < '1900-01-01')) as bad_birth
from public.perfiles;
