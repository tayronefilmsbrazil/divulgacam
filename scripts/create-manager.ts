/**
 * CLI: cria um usuário no Supabase Auth e vincula à campanha como gestor.
 *
 * Uso:
 *   pnpm create-manager --email=joao@exemplo.com --campaign=demo [--name="João"] [--password=...]
 *
 * Se --password for omitido, um password aleatório é gerado e impresso no console.
 * Requer .env.local com SUPABASE_SERVICE_ROLE_KEY configurado.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Database } from '../lib/supabase/database.types';

loadEnv();

type Args = {
  email: string;
  campaign: string;
  name?: string;
  password?: string;
};

function parseArgs(): Args {
  const out: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) out[match[1]] = match[2];
  }
  if (!out.email || !out.campaign) {
    console.error(
      'Uso: pnpm create-manager --email=... --campaign=<slug> [--name="..."] [--password=...]'
    );
    process.exit(1);
  }
  return out as Args;
}

function loadEnv() {
  try {
    const path = resolve(process.cwd(), '.env.local');
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local ausente — variáveis já podem estar exportadas
  }
}

async function main() {
  const args = parseArgs();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local'
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, slug, name')
    .eq('slug', args.campaign)
    .maybeSingle();

  if (campaignError) {
    console.error('Erro ao buscar campanha:', campaignError.message);
    process.exit(1);
  }
  if (!campaign) {
    console.error(`Campanha com slug "${args.campaign}" não encontrada.`);
    process.exit(1);
  }

  const password = args.password ?? randomBytes(9).toString('base64url');

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: args.email,
      password,
      email_confirm: true,
      user_metadata: args.name ? { name: args.name } : undefined,
    });

  if (createError || !created.user) {
    console.error(
      'Erro ao criar usuário:',
      createError?.message ?? 'usuário vazio'
    );
    process.exit(1);
  }

  const { error: insertError } = await supabase.from('managers').insert({
    id: created.user.id,
    campaign_id: campaign.id,
    email: args.email,
    name: args.name ?? null,
    role: 'user',
    status: 'approved',
  });

  if (insertError) {
    console.error('Erro ao gravar manager (desfazendo usuário):', insertError.message);
    await supabase.auth.admin.deleteUser(created.user.id);
    process.exit(1);
  }

  console.log('\n✓ Gestor criado com sucesso');
  console.log('  Campanha :', campaign.name, `(${campaign.slug})`);
  console.log('  E-mail   :', args.email);
  if (args.name) console.log('  Nome     :', args.name);
  if (!args.password) {
    console.log('  Senha    :', password, '  ← salve agora; não será mostrada de novo');
  }
  console.log('\nAcesse /login para entrar.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
