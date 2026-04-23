/**
 * Smoke test do export CSV: autentica via service_role como o gestor
 * e verifica que a query de leads retorna dados corretos.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Database } from '../lib/supabase/database.types';
import type { ParticipationType } from '../lib/supabase/types';

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

const TYPE_LABEL: Record<ParticipationType, string> = {
  apoiador: 'Apoiador',
  colaborador: 'Colaborador',
  lideranca: 'Liderança',
};

function csv(v: string | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
  });

  // Login como o gestor teste
  console.log('→ Login como gestor…');
  const { data: sign, error: signErr } = await supabase.auth.signInWithPassword({
    email: 'tayrone@tayronefilms.com.br',
    password: 'j-Vw8RhOLf3L',
  });
  if (signErr || !sign.user) {
    console.error('✗ Login falhou:', signErr?.message);
    process.exit(1);
  }
  console.log('✓ Logado');

  // Busca manager
  const { data: manager } = await supabase
    .from('managers')
    .select('campaign_id')
    .eq('id', sign.user.id)
    .maybeSingle();
  if (!manager) { console.error('✗ Manager não encontrado'); process.exit(1); }

  // Busca leads
  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('name, whatsapp, email, participation_type, created_at')
    .eq('campaign_id', manager.campaign_id)
    .order('created_at', { ascending: false });

  if (leadsErr) { console.error('✗ Erro leads:', leadsErr.message); process.exit(1); }

  const rows = leads ?? [];
  console.log(`✓ ${rows.length} lead(s) encontrado(s)`);

  // Monta CSV
  const header = 'Nome,WhatsApp,E-mail,Tipo de Participação,Data';
  const body = rows.map((l) => {
    const data = new Date(l.created_at).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    return [
      csv(l.name), csv(l.whatsapp), csv(l.email),
      csv(TYPE_LABEL[l.participation_type as ParticipationType]), csv(data),
    ].join(',');
  }).join('\n');

  const csvOutput = [header, ...body.split('\n')].join('\n');
  console.log('\n--- CSV Preview ---');
  console.log(csvOutput);
  console.log('---');

  await supabase.auth.signOut();
  console.log('\n✓ Export CSV 2B OK.');
}

main().catch((e) => { console.error(e); process.exit(1); });
