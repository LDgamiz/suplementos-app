-- =====================================================================
-- Data integrity: missing foreign keys + perfiles CHECK constraints.
-- Idempotent. Run in Supabase SQL Editor.
--
-- Pre-checked with _audit_data_integrity.sql:
--   - 0 orphan rutina_suplementos / suplementos rows
--   - 0 out-of-range weight/height/birth values in perfiles
-- so all the constraints below apply cleanly.
-- =====================================================================

-- 1. user_id → auth.users (ON DELETE CASCADE) on every table that owns
--    user-scoped data. Wrapped in DO blocks so re-runs are no-ops.

do $$ begin
  alter table public.perfiles
    add constraint perfiles_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.suplementos
    add constraint suplementos_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.rutinas
    add constraint rutinas_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.notif_settings
    add constraint notif_settings_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.push_subscriptions
    add constraint push_subscriptions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- 2. rutina_suplementos.rutina_id → rutinas(id) ON DELETE CASCADE.
do $$ begin
  alter table public.rutina_suplementos
    add constraint rutina_suplementos_rutina_id_fkey
    foreign key (rutina_id) references public.rutinas(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- 3. suplementos_cat.created_by → auth.users(id) ON DELETE SET NULL.
--    Keeps the catalog row alive (and credited to NULL) if the suggester
--    deletes their account.
do $$ begin
  alter table public.suplementos_cat
    add constraint suplementos_cat_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;
exception when duplicate_object then null; end $$;

-- 4. CHECK constraints on perfiles. Mirror the client-side validation in
--    src/pages/Profile.tsx so a malicious client cannot bypass it.

do $$ begin
  alter table public.perfiles
    add constraint perfiles_weight_kg_range
    check (weight_kg is null or (weight_kg >= 20 and weight_kg <= 400));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.perfiles
    add constraint perfiles_height_cm_range
    check (height_cm is null or (height_cm >= 50 and height_cm <= 250));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.perfiles
    add constraint perfiles_birth_date_range
    check (birth_date is null or (birth_date >= '1900-01-01' and birth_date <= current_date));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.perfiles
    add constraint perfiles_bio_max_length
    check (bio is null or char_length(bio) <= 500);
exception when duplicate_object then null; end $$;
