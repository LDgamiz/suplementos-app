-- =====================================================================
-- Pre-flight audit for data_integrity_v2.sql. Run this in the Supabase
-- SQL editor BEFORE applying v2. Each query should return zero rows; if
-- any return rows, fix or trim those values, then re-run the audit.
-- =====================================================================

-- suplementos.dosis: char_length 1..100
select id, char_length(dosis) as len from public.suplementos
  where dosis is null or char_length(dosis) < 1 or char_length(dosis) > 100;

-- rutinas.nombre: 1..100
select id, char_length(nombre) as len from public.rutinas
  where nombre is null or char_length(nombre) < 1 or char_length(nombre) > 100;

-- rutina_suplementos.dosis: 1..100
select id, char_length(dosis) as len from public.rutina_suplementos
  where dosis is null or char_length(dosis) < 1 or char_length(dosis) > 100;

-- suplementos_cat.name: 2..100
select id, char_length(name) as len from public.suplementos_cat
  where name is null or char_length(name) < 2 or char_length(name) > 100;

-- suplementos_cat.category: 2..50
select id, char_length(category) as len from public.suplementos_cat
  where category is null or char_length(category) < 2 or char_length(category) > 50;

-- suplementos_cat.dose_unit: 1..20
select id, char_length(dose_unit) as len from public.suplementos_cat
  where dose_unit is null or char_length(dose_unit) < 1 or char_length(dose_unit) > 20;

-- suplementos_cat.recommended_dose: > 0 and <= 100000
select id, recommended_dose from public.suplementos_cat
  where recommended_dose is null or recommended_dose <= 0 or recommended_dose > 100000;

-- routines.name: 1..100
select id, char_length(name) as len from public.routines
  where name is null or char_length(name) < 1 or char_length(name) > 100;

-- routine_days.name: nullable, max 50
select id, char_length(name) as len from public.routine_days
  where name is not null and char_length(name) > 50;

-- routine_exercises.name: 1..100
select id, char_length(name) as len from public.routine_exercises
  where name is null or char_length(name) < 1 or char_length(name) > 100;

-- routine_exercises.rep_range: nullable, max 30
select id, char_length(rep_range) as len from public.routine_exercises
  where rep_range is not null and char_length(rep_range) > 30;

-- routine_exercises.notes: nullable, max 500
select id, char_length(notes) as len from public.routine_exercises
  where notes is not null and char_length(notes) > 500;

-- workout_sets.reps: 0..1000
select id, reps from public.workout_sets
  where reps is not null and (reps < 0 or reps > 1000);

-- workout_sets.weight: 0..2000
select id, weight from public.workout_sets
  where weight is not null and (weight < 0 or weight > 2000);

-- notif_settings.timezone: max 50
select user_id, char_length(timezone) as len from public.notif_settings
  where timezone is not null and char_length(timezone) > 50;

-- perfiles.username: matches ^[a-z0-9_]{3,30}$
select user_id, username from public.perfiles
  where username is not null and username !~ '^[a-z0-9_]{3,30}$';

-- perfiles.full_name: max 100
select user_id, char_length(full_name) as len from public.perfiles
  where full_name is not null and char_length(full_name) > 100;

-- perfiles.country: max 60
select user_id, char_length(country) as len from public.perfiles
  where country is not null and char_length(country) > 60;

-- perfiles.goal: max 50
select user_id, char_length(goal) as len from public.perfiles
  where goal is not null and char_length(goal) > 50;

-- perfiles.activity: max 50
select user_id, char_length(activity) as len from public.perfiles
  where activity is not null and char_length(activity) > 50;
