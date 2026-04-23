/**
 * POST /api/leads/sync
 *
 * Endpoint chamado pelo n8n automaticamente quando uma nova linha é adicionada
 * na planilha do Google Sheets. Recebe os dados do lead, deduplica por WhatsApp
 * e insere no banco.
 *
 * Payload esperado (JSON):
 *   {
 *     secret:             string,       // LEADS_SYNC_SECRET
 *     campaign_id:        string,       // UUID da campanha
 *     nome:               string,
 *     whatsapp:           string,       // qualquer formato
 *     email?:             string,
 *     tipo_participacao?: string        // apoiador | colaborador | lideranca
 *   }
 *
 * Resposta:
 *   201 { ok: true, lead_id, action: 'inserted' | 'duplicate' }
 *   400 { error: string }
 *   401 { error: 'Não autorizado' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { ParticipationType } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const VALID_TYPES: ParticipationType[] = ['apoiador', 'colaborador', 'lideranca'];

/** Normaliza WhatsApp para dígitos apenas (para deduplicação) */
function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Formata número para o padrão (DDD) 9XXXX-XXXX */
function formatWhatsApp(raw: string): string {
  const digits = digitsOnly(raw);
  // Remove código de país 55 se presente
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    // Sem o 9 na frente — adiciona
    return `(${local.slice(0, 2)}) 9${local.slice(2, 6)}-${local.slice(6)}`;
  }
  // Retorna como veio se não reconheceu o padrão
  return raw.trim();
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // ── Autenticação ──────────────────────────────────────────────────────────
  const expectedSecret = process.env.LEADS_SYNC_SECRET;
  if (expectedSecret && body.secret !== expectedSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // ── Validação básica ──────────────────────────────────────────────────────
  const campaign_id = typeof body.campaign_id === 'string' ? body.campaign_id.trim() : '';
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const whatsappRaw = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : null;
  const tipoRaw = typeof body.tipo_participacao === 'string' ? body.tipo_participacao.trim().toLowerCase() : 'apoiador';

  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id obrigatório' }, { status: 400 });
  }
  if (!nome || nome.length < 2) {
    return NextResponse.json({ error: 'nome obrigatório (mín. 2 chars)' }, { status: 400 });
  }
  if (!whatsappRaw) {
    return NextResponse.json({ error: 'whatsapp obrigatório' }, { status: 400 });
  }

  const participation_type: ParticipationType = VALID_TYPES.includes(tipoRaw as ParticipationType)
    ? (tipoRaw as ParticipationType)
    : 'apoiador';

  const whatsapp = formatWhatsApp(whatsappRaw);

  const admin = supabaseAdmin();

  // ── Deduplicação por WhatsApp ─────────────────────────────────────────────
  // Compara pelo número formatado (mesma função formatWhatsApp → saída consistente)
  const { data: existing } = await admin
    .from('leads')
    .select('id')
    .eq('campaign_id', campaign_id)
    .eq('whatsapp', whatsapp)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { ok: true, lead_id: existing.id, action: 'duplicate' },
      { status: 200 },
    );
  }

  // ── Inserção ──────────────────────────────────────────────────────────────
  const { data: lead, error } = await admin
    .from('leads')
    .insert({
      campaign_id,
      name: nome,
      whatsapp,
      email,
      participation_type,
    })
    .select('id')
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { error: error?.message ?? 'Erro ao inserir lead' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, lead_id: lead.id, action: 'inserted' }, { status: 201 });
}
