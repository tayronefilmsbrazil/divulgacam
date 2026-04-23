-- Divulgacam · Sub-fase 2A (Auth + Painel + Dashboard)
-- Cria tabela managers (1 gestor por campanha) e ajusta RLS de leads
-- para permitir que gestores leiam apenas os leads da sua própria campanha.

-- ============================================================
-- managers
-- ============================================================
create table if not exists public.managers (
  id          uuid primary key references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name        text,
  email       text not null,
  created_at  timestamptz not null default now(),
  unique (campaign_id)
);

create index if not exists idx_managers_campaign_id on public.managers (campaign_id);

alter table public.managers enable row level security;

-- Gestor autenticado lê apenas o próprio registro.
drop policy if exists "managers_read_own" on public.managers;
create policy "managers_read_own"
  on public.managers for select
  to authenticated
  using (id = auth.uid());

-- ============================================================
-- leads: policy de leitura para gestor da mesma campanha
-- (inserts continuam vindo via service_role na API pública)
-- ============================================================
drop policy if exists "leads_read_by_manager" on public.leads;
create policy "leads_read_by_manager"
  on public.leads for select
  to authenticated
  using (
    campaign_id in (
      select campaign_id from public.managers where id = auth.uid()
    )
  );

-- ============================================================
-- campaigns: policy de update para o gestor da campanha (Fase 2C)
-- Leitura pública já existe (campaigns_public_read).
-- ============================================================
drop policy if exists "campaigns_update_by_manager" on public.campaigns;
create policy "campaigns_update_by_manager"
  on public.campaigns for update
  to authenticated
  using (
    id in (select campaign_id from public.managers where id = auth.uid())
  )
  with check (
    id in (select campaign_id from public.managers where id = auth.uid())
  );
