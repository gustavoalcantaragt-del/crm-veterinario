-- Phase 1 foundation for turning the CRM into a commercial + delivery platform.
-- Run in Supabase SQL Editor after reviewing the existing schema and taking a backup.

create extension if not exists pgcrypto;

-- CRM enrichment
alter table leads add column if not exists temperature text
  check (temperature is null or temperature in ('frio','morno','quente'));
alter table leads add column if not exists product_interest text
  check (product_interest is null or product_interest in ('mentoria','consultoria','low_ticket','diagnostico','treinamento','implementacao','outro'));
alter table leads add column if not exists next_action text;
alter table leads add column if not exists lost_reason text;
alter table leads add column if not exists won_reason text;
alter table leads add column if not exists stage_entered_at timestamptz default now();

-- Central tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#d4af37',
  category text not null default 'geral',
  description text,
  scope text[] not null default array['leads'],
  is_active boolean not null default true,
  is_system boolean not null default false,
  is_sensitive boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tag_assignments (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references tags(id) on delete cascade,
  entity_type text not null check (entity_type in ('lead','client','mentorship','project','task','session','product','purchase','campaign')),
  entity_id uuid not null,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(tag_id, entity_type, entity_id)
);

-- Linked tasks. Existing columns keep working; these add entity binding.
alter table tasks add column if not exists assignee_id uuid references auth.users(id) on delete set null;
alter table tasks add column if not exists entity_type text
  check (entity_type is null or entity_type in ('lead','client','mentorship','project','session'));
alter table tasks add column if not exists entity_id uuid;
alter table tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table tasks add column if not exists comments jsonb not null default '[]'::jsonb;

-- Mentoring sessions and hour bank
create table if not exists mentoring_sessions (
  id uuid primary key default gen_random_uuid(),
  mentorship_id uuid references mentorships(id) on delete cascade,
  title text not null,
  starts_at timestamptz,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  status text not null default 'agendada'
    check (status in ('agendada','realizada','cancelada','remarcada','faltou')),
  notes text,
  next_steps text,
  meeting_link text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists hour_banks (
  id uuid primary key default gen_random_uuid(),
  client_name text,
  entity_type text not null check (entity_type in ('mentorship','project')),
  entity_id uuid not null,
  contracted_minutes integer not null default 0 check (contracted_minutes >= 0),
  used_minutes integer not null default 0 check (used_minutes >= 0),
  starts_at date,
  ends_at date,
  status text not null default 'ativo' check (status in ('ativo','pausado','encerrado','vencido')),
  created_at timestamptz not null default now()
);

-- Consulting/project delivery
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  client_name text not null,
  name text not null,
  type text not null default 'consultoria',
  status text not null default 'diagnostico'
    check (status in ('diagnostico','planejamento','execucao','validacao','pausado','concluido','cancelado')),
  scope text,
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  used_minutes integer not null default 0 check (used_minutes >= 0),
  value numeric(12,2) not null default 0,
  start_date date,
  due_date date,
  responsible_id uuid references auth.users(id) on delete set null,
  risks text,
  next_delivery text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Low tickets and upsell
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'low_ticket'
    check (type in ('low_ticket','mentoria','consultoria','diagnostico','treinamento','outro')),
  price numeric(12,2) not null default 0,
  status text not null default 'ativo' check (status in ('ativo','inativo','arquivado')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  lead_id uuid references leads(id) on delete set null,
  client_name text,
  value numeric(12,2) not null default 0,
  source text,
  purchased_at timestamptz not null default now(),
  upsell_status text not null default 'nao_iniciado'
    check (upsell_status in ('nao_iniciado','em_contato','oferta_enviada','convertido','perdido')),
  created_at timestamptz not null default now()
);

-- Simple automation registry
create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_tag_assignments_entity on tag_assignments(entity_type, entity_id);
create index if not exists idx_tasks_entity on tasks(entity_type, entity_id);
create index if not exists idx_sessions_mentorship on mentoring_sessions(mentorship_id);
create index if not exists idx_hour_banks_entity on hour_banks(entity_type, entity_id);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_purchases_product on purchases(product_id);

alter table tags enable row level security;
alter table tag_assignments enable row level security;
alter table mentoring_sessions enable row level security;
alter table hour_banks enable row level security;
alter table projects enable row level security;
alter table products enable row level security;
alter table purchases enable row level security;
alter table automations enable row level security;

create or replace function public.app_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role from public.user_profiles where id = auth.uid()),
    'anon'
  );
$$;

-- Baseline role policies. Keep private delivery/finance data restricted by default.
drop policy if exists "tags_auth_all" on tags;
create policy "tags_auth_all" on tags
  for all to authenticated
  using (not is_sensitive or public.app_role() in ('admin','dev'))
  with check (public.app_role() in ('admin','dev'));

drop policy if exists "tag_assignments_auth_all" on tag_assignments;
create policy "tag_assignments_auth_all" on tag_assignments
  for all to authenticated
  using (true)
  with check (public.app_role() in ('admin','dev','estagiario','marketing'));

drop policy if exists "mentoring_sessions_auth_all" on mentoring_sessions;
create policy "mentoring_sessions_auth_all" on mentoring_sessions
  for all to authenticated
  using (public.app_role() in ('admin','dev'))
  with check (public.app_role() in ('admin','dev'));

drop policy if exists "hour_banks_auth_all" on hour_banks;
create policy "hour_banks_auth_all" on hour_banks
  for all to authenticated
  using (public.app_role() in ('admin','dev'))
  with check (public.app_role() in ('admin','dev'));

drop policy if exists "projects_auth_all" on projects;
create policy "projects_auth_all" on projects
  for all to authenticated
  using (public.app_role() in ('admin','dev'))
  with check (public.app_role() in ('admin','dev'));

drop policy if exists "products_auth_all" on products;
create policy "products_auth_all" on products
  for select to authenticated
  using (true);
drop policy if exists "products_manage_roles" on products;
create policy "products_manage_roles" on products
  for all to authenticated
  using (public.app_role() in ('admin','dev','marketing'))
  with check (public.app_role() in ('admin','dev','marketing'));

drop policy if exists "purchases_auth_all" on purchases;
create policy "purchases_auth_all" on purchases
  for all to authenticated
  using (public.app_role() in ('admin','dev'))
  with check (public.app_role() in ('admin','dev'));

drop policy if exists "automations_auth_all" on automations;
create policy "automations_auth_all" on automations
  for all to authenticated
  using (public.app_role() in ('admin','dev'))
  with check (public.app_role() in ('admin','dev'));
