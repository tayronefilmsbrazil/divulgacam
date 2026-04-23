-- Divulgacam · Fase 1 (Core Público)
-- Tabelas: campaigns + leads. Tabelas de gestor/materiais/disparos entram nas Fases 2 e 3.

create extension if not exists "pgcrypto";

-- ============================================================
-- campaigns
-- ============================================================
create table if not exists public.campaigns (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  name               text not null,
  candidate_name     text,
  logo_url           text,
  primary_color      text not null default '#E84C22',
  n8n_webhook_url    text,
  whatsapp_instance  text,
  email_from         text,
  smtp_config        jsonb,
  created_at         timestamptz not null default now()
);

create index if not exists idx_campaigns_slug on public.campaigns (slug);

-- ============================================================
-- leads
-- ============================================================
create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.campaigns(id) on delete cascade,
  name                text not null,
  whatsapp            text not null,
  email               text,
  participation_type  text not null check (participation_type in ('apoiador','colaborador','lideranca')),
  created_at          timestamptz not null default now()
);

create index if not exists idx_leads_campaign_id on public.leads (campaign_id);
create index if not exists idx_leads_created_at on public.leads (created_at desc);

-- ============================================================
-- RLS
-- ============================================================
-- campaigns: leitura pública por slug (landing renderiza sem auth).
alter table public.campaigns enable row level security;
drop policy if exists "campaigns_public_read" on public.campaigns;
create policy "campaigns_public_read"
  on public.campaigns for select
  to anon, authenticated
  using (true);

-- leads: nenhum acesso público. Inserts e leituras só via service_role
-- (API route em /api/leads e, futuramente, painel do gestor com RLS por manager).
alter table public.leads enable row level security;
-- (Sem policies aqui; service_role ignora RLS e continua podendo inserir/ler.)

-- ============================================================
-- Seed opcional (remova em produção)
-- ============================================================
-- insert into public.campaigns (slug, name, candidate_name, n8n_webhook_url)
-- values ('demo', 'Campanha Demo', 'João Candidato', 'https://n8n.exemplo.com.br/webhook/demo-test')
-- on conflict (slug) do nothing;
