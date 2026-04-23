/**
 * POST /api/blasts/update
 *
 * Endpoint de callback para o n8n atualizar o status de um blast
 * após completar o envio de WhatsApp via Evolution API.
 *
 * Payload esperado (JSON):
 *   {
 *     blast_id:     string,
 *     sent_count:   number,
 *     failed_count: number,
 *     status:       'completed' | 'failed',
 *     secret:       string  // BLAST_CALLBACK_SECRET
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: {
    blast_id?: string;
    sent_count?: number;
    failed_count?: number;
    status?: string;
    secret?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // — Autenticação por secret compartilhado —
  const expectedSecret = process.env.BLAST_CALLBACK_SECRET;
  if (expectedSecret && body.secret !== expectedSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { blast_id, sent_count, failed_count, status } = body;

  if (!blast_id) {
    return NextResponse.json({ error: 'blast_id obrigatório' }, { status: 400 });
  }
  if (!['completed', 'failed', 'sending'].includes(status ?? '')) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const update: Record<string, unknown> = {
    status,
    sent_count: sent_count ?? 0,
    failed_count: failed_count ?? 0,
  };

  if (status === 'completed' || status === 'failed') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await admin
    .from('blasts')
    .update(update as never)
    .eq('id', blast_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
