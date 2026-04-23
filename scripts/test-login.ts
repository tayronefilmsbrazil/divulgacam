/**
 * Smoke test da autenticação da Sub-fase 2A:
 * 1. Faz login com anon key (mesma que o browser usa) usando credenciais do gestor teste.
 * 2. Verifica que o manager + campaign vinculados aparecem via RLS.
 * 3. Conta leads visíveis (policy leads_read_by_manager).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Database } from '../lib/supabase/database.types';

// Carrega .env.local
try {
  const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const [k, v] = [t.slice(0, eq).trim(), t.slice(eq + 1).trim()];
    if (!process.env[k]) process.env[k] = v;
  }
} catch {}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Uso: tsx scripts/test-login.ts <email> <password>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(url, anon, {
  auth: { persistSession: false },
});

async function main() {
  console.log('→ signInWithPassword …');
  const { data: sign, error: signErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signErr || !sign.user) {
    console.error('✗ Falhou:', signErr?.message);
    process.exit(1);
  }
  console.log('✓ Logado como', sign.user.email, '(id:', sign.user.id + ')');

  console.log('→ Lendo managers (RLS: id = auth.uid()) …');
  const { data: mgr, error: mgrErr } = await supabase
    .from('managers')
    .select('id, campaign_id, name, email, campaigns(slug, name)')
    .single();
  if (mgrErr) {
    console.error('✗ Erro em managers:', mgrErr.message);
    process.exit(1);
  }
  console.log('✓ Manager:', mgr);

  console.log('→ Contando leads visíveis via RLS …');
  const { count, error: leadsErr } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true });
  if (leadsErr) {
    console.error('✗ Erro em leads:', leadsErr.message);
    process.exit(1);
  }
  console.log('✓ Leads visíveis:', count);

  await supabase.auth.signOut();
  console.log('\n✓ Fluxo 2A OK — auth + RLS funcionando.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
