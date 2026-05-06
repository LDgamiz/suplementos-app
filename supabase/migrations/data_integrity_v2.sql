-- =====================================================================
-- Data integrity v2: CHECK constraints across the rest of the schema.
-- Mirrors the limits in src/lib/validation.ts so a malicious client that
-- bypasses the React layer still gets blocked at the database boundary.
--
-- Idempotent: each ALTER is wrapped in a DO block that swallows the
-- duplicate_object error so re-running is a no-op.
--
-- IMPORTANT: run supabase/migrations/_audit_data_integrity_v2.sql FIRST
-- to detect any existing rows that would violate these constraints.
-- =====================================================================

-- ---------- suplementos -------------------------------------------------

do $$ begin
  alter table public.suplementos
    add constraint suplementos_dosis_length
    check (char_length(dosis) between 1 and 100);
exception when duplicate_object then null; end $$;

-- ---------- rutinas + rutina_suplementos --------------------------------

do $$ begin
  alter table public.rutinas
    add constraint rutinas_nombre_length
    check (char_length(nombre) between 1 and 100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.rutina_suplementos
    add constraint rutina_suplementos_dosis_length
    check (char_length(dosis) between 1 and 100);
exception when duplicate_object then null; end $$;

-- ---------- suplementos_cat ---------------------------------------------

do $$ begin
  alter table public.suplementos_cat
    add constraint suplementos_cat_name_length
    check (char_length(name) between 2 and 100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.suplementos_cat
    add constraint suplementos_cat_category_length
    check (char_length(category) between 2 and 50);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.suplementos_cat
    add constraint suplementos_cat_dose_unit_length
    check (char_length(dose_unit) between 1 and 20);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.suplementos_cat
    add constraint suplementos_cat_dose_range
    check (recommended_dose > 0 and recommended_dose <= 100000);
exception when duplicate_object then null; end $$;

-- ---------- routines ----------------------------------------------------

do $$ begin
  alter table public.routines
    add constraint routines_name_length
    check (char_length(name) between 1 and 100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.routine_days
    add constraint routine_days_name_length
    check (name is null or char_length(name) <= 50);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.routine_exercises
    add constraint routine_exercises_name_length
    check (char_length(name) between 1 and 100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.routine_exercises
    add constraint routine_exercises_rep_range_length
    check (rep_range is null or char_length(rep_range) <= 30);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.routine_exercises
    add constraint routine_exercises_notes_length
    check (notes is null or char_length(notes) <= 500);
exception when duplicate_object then null; end $$;

-- (routine_exercises.sets between 1 and 20 is already in training_schema.sql)

-- ---------- workout_sets ------------------------------------------------

do $$ begin
  alter table public.workout_sets
    add constraint workout_sets_reps_range
    check (reps is null or (reps >= 0 and reps <= 1000));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.workout_sets
    add constraint workout_sets_weight_range
    check (weight is null or (weight >= 0 and weight <= 2000));
exception when duplicate_object then null; end $$;

-- ---------- notif_settings ----------------------------------------------

do $$ begin
  alter table public.notif_settings
    add constraint notif_settings_timezone_length
    check (timezone is null or char_length(timezone) <= 50);
exception when duplicate_object then null; end $$;

-- ---------- perfiles (extends data_integrity.sql) -----------------------

-- Username is permanent + already lowercased client-side. Enforce format here too.
do $$ begin
  alter table public.perfiles
    add constraint perfiles_username_format
    check (username is null or username ~ '^[a-z0-9_]{3,30}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.perfiles
    add constraint perfiles_full_name_length
    check (full_name is null or char_length(full_name) <= 100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.perfiles
    add constraint perfiles_country_length
    check (country is null or char_length(country) <= 60);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.perfiles
    add constraint perfiles_goal_length
    check (goal is null or char_length(goal) <= 50);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.perfiles
    add constraint perfiles_activity_length
    check (activity is null or char_length(activity) <= 50);
exception when duplicate_object then null; end $$;
