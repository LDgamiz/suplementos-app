-- =====================================================================
-- Enable Row-Level Security on all public tables
-- Run this once in Supabase SQL Editor.
-- Idempotent: re-running it does not break existing policies.
-- =====================================================================

-- 1. suplementos: user-owned + public read when publico=true
alter table public.suplementos enable row level security;

drop policy if exists "users manage own suplementos" on public.suplementos;
create policy "users manage own suplementos"
  on public.suplementos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "anyone reads public suplementos" on public.suplementos;
create policy "anyone reads public suplementos"
  on public.suplementos for select
  using (publico = true);

-- 2. rutinas: owner only
alter table public.rutinas enable row level security;

drop policy if exists "users manage own rutinas" on public.rutinas;
create policy "users manage own rutinas"
  on public.rutinas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. rutina_suplementos: belongs to a rutina the user owns
alter table public.rutina_suplementos enable row level security;

drop policy if exists "users manage own rutina_suplementos" on public.rutina_suplementos;
create policy "users manage own rutina_suplementos"
  on public.rutina_suplementos for all
  using (
    exists (
      select 1 from public.rutinas r
      where r.id = rutina_suplementos.rutina_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rutinas r
      where r.id = rutina_suplementos.rutina_id
        and r.user_id = auth.uid()
    )
  );

-- 4. perfiles: public read (public profiles), owner-only write
alter table public.perfiles enable row level security;

drop policy if exists "anyone reads perfiles" on public.perfiles;
create policy "anyone reads perfiles"
  on public.perfiles for select
  using (true);

drop policy if exists "users insert own perfil" on public.perfiles;
create policy "users insert own perfil"
  on public.perfiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own perfil" on public.perfiles;
create policy "users update own perfil"
  on public.perfiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. suplementos_cat: public catalog, admin-only write
alter table public.suplementos_cat enable row level security;

drop policy if exists "anyone reads suplementos_cat" on public.suplementos_cat;
create policy "anyone reads suplementos_cat"
  on public.suplementos_cat for select
  using (true);

drop policy if exists "admins write suplementos_cat" on public.suplementos_cat;
create policy "admins write suplementos_cat"
  on public.suplementos_cat for all
  using (public.is_admin())
  with check (public.is_admin());
