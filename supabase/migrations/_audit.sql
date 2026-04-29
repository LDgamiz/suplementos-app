-- =====================================================================
-- Audit script: run this in Supabase SQL Editor to verify that all the
-- security migrations are applied. Read-only — does not modify anything.
-- =====================================================================

-- 1. RLS state per app table. Expected: all `true`.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'suplementos','rutinas','rutina_suplementos',
    'perfiles','suplementos_cat',
    'notif_settings','push_subscriptions'
  )
order by relname;

-- 2. Policies per app table. Expected: each table has at least 1 policy.
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. suplementos_cat moderation columns. Expected: status, created_by, created_at exist.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'suplementos_cat'
order by ordinal_position;

-- 4. Trigger that cleans suplementos when a cat is rejected. Expected: 1 row.
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.suplementos_cat'::regclass
  and not tgisinternal;

-- 5. notif_settings unique constraint on user_id. Expected: 1 row (PK or UNIQUE).
select conname, contype
from pg_constraint
where conrelid = 'public.notif_settings'::regclass
  and contype in ('p','u');

-- 6. Storage policies on the avatars bucket. Expected: 4 rows
--    (anyone reads + users upload/update/delete own).
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname ilike '%avatar%'
order by policyname;

-- 7. Avatars bucket exists and is public. Expected: 1 row, public=true.
select id, name, public from storage.buckets where id = 'avatars';
