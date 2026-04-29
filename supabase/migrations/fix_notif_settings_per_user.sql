-- =====================================================================
-- Fix: notif_settings y push_subscriptions deben ser per-user.
-- Idempotente. Si ya están bien, no hace nada destructivo.
-- =====================================================================

-- 1. Asegurar columnas y NOT NULL en notif_settings.
--    (si la tabla no existe, la crea con el schema correcto)
create table if not exists public.notif_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  hora       text not null default '08:00',
  activa     boolean not null default false,
  timezone   text not null default 'UTC',
  updated_at timestamptz not null default now()
);

-- 2. Si la tabla existía con otro schema, normalizar:
--    (estos comandos fallan inofensivamente si ya están aplicados)
alter table public.notif_settings
  alter column user_id set not null;

-- Borrar filas huérfanas que no apunten a un usuario real
delete from public.notif_settings ns
where not exists (select 1 from auth.users u where u.id = ns.user_id);

-- Si hay duplicados por user_id, dejar solo el más reciente
delete from public.notif_settings a
using public.notif_settings b
where a.user_id = b.user_id
  and a.ctid < b.ctid
  and (
    a.updated_at < b.updated_at
    or (a.updated_at = b.updated_at)
  );

-- Asegurar UNIQUE en user_id (necesario para que onConflict del cliente funcione).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.notif_settings'::regclass
      and contype in ('p','u')
      and conkey = array(
        select attnum from pg_attribute
        where attrelid = 'public.notif_settings'::regclass and attname = 'user_id'
      )
  ) then
    alter table public.notif_settings
      add constraint notif_settings_user_id_key unique (user_id);
  end if;
end $$;

-- 3. RLS estricta per-user
alter table public.notif_settings enable row level security;

drop policy if exists "users manage own notif_settings" on public.notif_settings;
create policy "users manage own notif_settings"
  on public.notif_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Mismo trato a push_subscriptions
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

delete from public.push_subscriptions ps
where not exists (select 1 from auth.users u where u.id = ps.user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "users manage own push_subscriptions" on public.push_subscriptions;
create policy "users manage own push_subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
