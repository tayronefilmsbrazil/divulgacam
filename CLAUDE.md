# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Divulgacam

Multi-tenant SaaS platform for political/business campaigns. Managers create campaigns with public landing pages to capture leads, then blast messages to those leads via WhatsApp (delegated to n8n + Evolution API) and email (Resend).

The app is in Brazilian Portuguese — all UI text, route names (`/painel`, `/disparar`, `/historico`), and user-facing copy are in pt-BR.

## Commands

```bash
pnpm dev          # Start dev server (Next.js)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm create-manager --email=x@y.com --campaign=slug --name="Name"  # Create manager user
```

No test framework is configured.

## Architecture

**Next.js 14 App Router** with Supabase (Postgres + Storage + Auth), Tailwind CSS, Zod validation. Deploy target: Vercel.

### Two Supabase clients

- `lib/supabase/server.ts` — cookie-aware SSR client (`anon` key, respects RLS). Used in Server Components and Server Actions.
- `lib/supabase/admin.ts` — singleton `service_role` client (bypasses RLS). Used in API routes and background operations. **Never import in client code.**

### Auth flow

- Supabase Auth for managers (email/password, invite-only via `scripts/create-manager.ts`).
- `middleware.ts` runs on `/painel/*` and `/login` — calls `lib/supabase/middleware.ts` `updateSession()` to refresh tokens and redirect unauthenticated users.
- `lib/painel/session.ts` `requireManagerSession()` is the guard for all `/painel` Server Components — returns `{ manager, campaign }` or redirects to `/login`.

### Multi-tenancy model

Each manager belongs to exactly one campaign (`managers.campaign_id`). RLS policies scope all queries to the manager's campaign. Public landing pages use `[slug]` dynamic route.

### Key data flow

1. **Lead capture:** Public form at `/[slug]` → `POST /api/leads` → Zod validation → insert via admin client → fire-and-forget POST to campaign's `n8n_webhook_url` (5s timeout).
2. **Blasts (messages):** Server Action `app/painel/disparar/actions.ts` `createBlast()` → email sent directly via Resend batch API, WhatsApp delegated to n8n webhook. Blast status tracked in `blasts` table, updated by callback at `/api/blasts/update`.
3. **Lead sync:** External systems can push leads via `POST /api/leads/sync` (secret-protected).

### Domain types

`lib/supabase/types.ts` has the app-level types (`Campaign`, `Lead`, `Blast`, etc.). `lib/supabase/database.types.ts` has Supabase-generated types.

### Migrations

SQL migrations live in `supabase/migrations/` — applied manually via Supabase SQL Editor (no Supabase CLI local setup).
