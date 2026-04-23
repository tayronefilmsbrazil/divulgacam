# Divulgacam

Plataforma SaaS multi-tenant para campanhas políticas e empresariais — captação de leads via landing page pública e (em fases futuras) distribuição de materiais por WhatsApp e e-mail.

> **Status:** Fase 1 ✓ (captação + n8n) · Sub-fase 2A ✓ (auth + dashboard).
> Próximas: Sub-fases 2B (leads) / 2C (materiais / configurações) / Fase 3 (disparos).

---

## Stack

- **Next.js 14+** (App Router) + **TypeScript** estrito
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Storage + Auth futuramente)
- **Zod** para validação
- Deploy alvo: **Vercel**

## Estrutura

```
app/
  [slug]/page.tsx              Landing pública por campanha
  [slug]/confirmacao/page.tsx  Tela pós-cadastro
  login/page.tsx               Tela de login do gestor
  login/actions.ts             Server Action do login
  painel/layout.tsx            Layout autenticado (sidebar)
  painel/page.tsx              Dashboard com KPIs
  api/leads/route.ts           POST /api/leads (salva + dispara n8n)
  api/auth/logout/route.ts     POST /api/auth/logout
components/                    LandingHeader, LeadForm, LoginForm, painel/Sidebar
lib/
  supabase/server.ts           Cliente SSR (cookies-aware)
  supabase/admin.ts            Cliente service_role (API routes)
  supabase/middleware.ts       Helper de auth para middleware
  painel/session.ts            requireManagerSession() p/ Server Components
  validation/lead.ts           Schema Zod
  utils/whatsapp-mask.ts       Máscara (XX) 9XXXX-XXXX
middleware.ts                  Protege /painel/*, redireciona /login se autenticado
scripts/
  create-manager.ts            CLI para criar gestor + vinculá-lo a campanha
supabase/migrations/
  20260422_init_phase1.sql     campaigns + leads
  20260422_phase2a_auth.sql    managers + RLS de leads/campaigns
```

---

## Setup local

### 1. Pré-requisitos

- Node.js 20+
- **pnpm** (`npm install -g pnpm`)
- Projeto criado no [Supabase](https://supabase.com)

### 2. Dependências

```bash
pnpm install
```

### 3. Variáveis de ambiente

Copie e preencha:

```bash
cp .env.example .env.local
```

Obrigatórios na Fase 1:

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (**nunca** expor no frontend) |
| `NEXT_PUBLIC_APP_URL` | URL pública do app (ex.: `https://divulgacam.com.br`) |

### 4. Banco de dados

Abra o **SQL Editor** do Supabase e rode o conteúdo de:

```
supabase/migrations/20260422_init_phase1.sql
```

Isso cria as tabelas `campaigns` e `leads`, índices e policies RLS.

### 5. Cadastrar uma campanha (enquanto o painel não existe)

Na Fase 1 ainda não há painel do gestor — use o SQL Editor do Supabase:

```sql
insert into public.campaigns (slug, name, candidate_name, n8n_webhook_url)
values (
  'demo',
  'Campanha Demo',
  'João Candidato',
  'https://n8n.seudominio.com/webhook/divulgacam-demo'
);
```

> Dica: `primary_color` já tem default `#E84C22`. Para personalizar, inclua a coluna no insert.

### 6. Rodar

```bash
pnpm dev
```

Abra `http://localhost:3000/demo`.

---

## Como o fluxo funciona

1. O usuário acessa `/[slug]` — Server Component busca a campanha no Supabase pelo `slug`. Se não existir, 404.
2. Preenche o formulário (tipo de participação, nome, WhatsApp com máscara, e-mail opcional).
3. Submit → `POST /api/leads`:
   - Valida com Zod.
   - Insere o lead no Supabase via `service_role`.
   - Dispara `POST` para o `n8n_webhook_url` da campanha (timeout 5s — falha aqui **não** impede o cadastro).
4. Redireciona para `/[slug]/confirmacao`.

### Payload enviado ao n8n

```json
{
  "nome": "Maria Silva",
  "whatsapp": "(82) 98765-4321",
  "email": "maria@exemplo.com",
  "tipo_participacao": "apoiador",
  "campanha_id": "uuid-da-campanha",
  "campanha_slug": "demo",
  "timestamp": "2026-04-22T14:00:00.000Z"
}
```

No n8n, crie um workflow com gatilho **Webhook** (method `POST`, response mode `immediately`). Copie a URL e cole no campo `n8n_webhook_url` da campanha.

---

## Deploy na Vercel

1. Faça push do repositório para GitHub/GitLab.
2. Em **Vercel → New Project**, importe o repositório.
3. Configure as mesmas variáveis do `.env.local` em **Settings → Environment Variables** (Production).
4. Deploy.
5. Aponte o domínio `divulgacam.com.br` nos **Settings → Domains**.

---

## Criar um gestor (invite-only)

Na Sub-fase 2A não há auto-cadastro. Para dar acesso ao painel:

```bash
pnpm create-manager --email=maria@exemplo.com --campaign=demo --name="Maria Silva"
```

O script:
1. Cria o usuário no Supabase Auth (com e-mail já confirmado).
2. Insere na tabela `managers` vinculando-o à campanha.
3. Se `--password` não for passado, gera uma senha aleatória e imprime **uma única vez** no console.

Depois o gestor entra em `http://localhost:3000/login` e acessa `/painel`.

## Próximas fases

- **Sub-fase 2B — Leads:** listagem paginada, filtros, export CSV.
- **Sub-fase 2C — Materiais + configurações:** upload para Supabase Storage, biblioteca, tela de configurações.
- **Fase 3 — Disparos:** Evolution API (WhatsApp) + Resend (e-mail), histórico, logs.

---

*Tayrone Films · 2026*
