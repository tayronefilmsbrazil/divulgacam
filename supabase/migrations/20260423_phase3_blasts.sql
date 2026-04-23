-- Divulgacam · Fase 3 (Disparos)
-- Tabelas blasts + blast_logs com RLS.

-- ============================================================
-- blasts — um registro por disparo
-- ============================================================
create table if not exists public.blasts (
  id               uuid        primary key default gen_random_uuid(),
  campaign_id      uuid        not null references public.campaigns(id) on delete cascade,
  manager_id       uuid        not null references public.managers(id),
  channel          text        not null check (channel in ('whatsapp', 'email', 'both')),
  message          text        not null,
  material_url     text,
  filters          jsonb       not null default '{}',
  total_recipients integer     not null default 0,
  sent_count       integer     not null default 0,
  failed_count     integer     not null default 0,
  status           text        not null default 'pending'
                               check (status in ('pending','sending','completed','failed')),
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists idx_blasts_campaign_id on public.blasts (campaign_id);
create index if not exists idx_blasts_created_at  on public.blasts (created_at desc);

alter table public.blasts enable row level security;

drop policy if exists "managers_read_blasts"   on public.blasts;
create policy "managers_read_blasts"
  on public.blasts for select
  to authenticated
  using (
    campaign_id in (select campaign_id from public.managers where id = auth.uid())
  );

drop policy if exists "managers_insert_blasts" on public.blasts;
create policy "managers_insert_blasts"
  on public.blasts for insert
  to authenticated
  with check (
    campaign_id in (select campaign_id from public.managers where id = auth.uid())
  );

drop policy if exists "managers_update_blasts" on public.blasts;
create policy "managers_update_blasts"
  on public.blasts for update
  to authenticated
  using (
    campaign_id in (select campaign_id from public.managers where id = auth.uid())
  );

-- ============================================================
-- blast_logs — log por lead/canal
-- ============================================================
create table if not exists public.blast_logs (
  id            uuid        primary key default gen_random_uuid(),
  blast_id      uuid        not null references public.blasts(id) on delete cascade,
  lead_id       uuid        not null references public.leads(id) on delete cascade,
  channel       text        not null check (channel in ('whatsapp', 'email')),
  status        text        not null default 'pending'
                            check (status in ('pending','sent','failed')),
  error_message text,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_blast_logs_blast_id on public.blast_logs (blast_id);

alter table public.blast_logs enable row level security;

drop policy if exists "managers_read_blast_logs" on public.blast_logs;
create policy "managers_read_blast_logs"
  on public.blast_logs for select
  to authenticated
  using (
    blast_id in (
      select id from public.blasts
      where campaign_id in (
        select campaign_id from public.managers where id = auth.uid()
      )
    )
  );
