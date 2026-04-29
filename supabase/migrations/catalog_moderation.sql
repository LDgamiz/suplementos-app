-- =====================================================================
-- Catalog moderation: status + created_by + RLS + cleanup trigger.
-- Idempotent. Run after enable_rls.sql.
-- =====================================================================

-- 1. Columns
alter table public.suplementos_cat
  add column if not exists status text not null default 'pending'
    check (status in ('pending','approved','rejected'));

alter table public.suplementos_cat
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.suplementos_cat
  add column if not exists created_at timestamptz not null default now();

-- 2. Bootstrap: existing rows are considered approved
update public.suplementos_cat set status = 'approved' where status = 'pending';

-- 3. Index for admin/list filters
create index if not exists suplementos_cat_status_idx on public.suplementos_cat(status);

-- 4. RLS policies (replace the broad ones from enable_rls.sql)
alter table public.suplementos_cat enable row level security;

drop policy if exists "anyone reads suplementos_cat" on public.suplementos_cat;
drop policy if exists "admins write suplementos_cat" on public.suplementos_cat;
drop policy if exists "read approved or own suggestions" on public.suplementos_cat;
drop policy if exists "users insert pending suggestions" on public.suplementos_cat;
drop policy if exists "admins update suplementos_cat" on public.suplementos_cat;
drop policy if exists "admins delete suplementos_cat" on public.suplementos_cat;

create policy "read approved or own suggestions"
  on public.suplementos_cat for select
  using (
    status = 'approved'
    or auth.uid() = created_by
    or public.is_admin()
  );

create policy "users insert pending suggestions"
  on public.suplementos_cat for insert
  with check (
    auth.uid() = created_by
    and status = 'pending'
  );

create policy "admins update suplementos_cat"
  on public.suplementos_cat for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete suplementos_cat"
  on public.suplementos_cat for delete
  using (public.is_admin());

-- 5. Trigger: when admin rejects a cat, drop the daily rows that
--    reference it. The cat row stays for history.
create or replace function public.cleanup_rejected_suplementos_cat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'rejected' and old.status is distinct from 'rejected' then
    delete from public.suplementos where suplemento_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists cleanup_rejected_suplementos_cat_trg on public.suplementos_cat;
create trigger cleanup_rejected_suplementos_cat_trg
  after update on public.suplementos_cat
  for each row execute function public.cleanup_rejected_suplementos_cat();
