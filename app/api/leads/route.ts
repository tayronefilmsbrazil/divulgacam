import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { leadSchema } from '@/lib/validation/lead';

const N8N_TIMEOUT_MS = 5000;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Dados inválidos.',
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const { nome, whatsapp, email, tipo_participacao, campanha_id } = parsed.data;
  const supabase = supabaseAdmin();

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, slug, n8n_lead_webhook_url')
    .eq('id', campanha_id)
    .maybeSingle();

  if (campaignError) {
    console.error('[api/leads] erro ao buscar campanha:', campaignError.message);
    return NextResponse.json(
      { error: 'Erro ao validar campanha.' },
      { status: 500 }
    );
  }
  if (!campaign) {
    return NextResponse.json(
      { error: 'Campanha não encontrada.' },
      { status: 404 }
    );
  }

  const { data: insertedLead, error: insertError } = await supabase
    .from('leads')
    .insert({
      campaign_id: campaign.id,
      name: nome,
      whatsapp,
      email: email && email.length > 0 ? email : null,
      participation_type: tipo_participacao,
    })
    .select('id')
    .single();

  if (insertError || !insertedLead) {
    console.error('[api/leads] erro ao inserir lead:', insertError?.message);
    return NextResponse.json(
      { error: 'Não foi possível salvar o cadastro.' },
      { status: 500 }
    );
  }

  if (campaign.n8n_lead_webhook_url) {
    const payload = {
      nome,
      whatsapp,
      email: email && email.length > 0 ? email : null,
      tipo_participacao,
      campanha_id: campaign.id,
      campanha_slug: campaign.slug,
      timestamp: new Date().toISOString(),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);
    try {
      const response = await fetch(campaign.n8n_lead_webhook_url!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        console.error(
          `[api/leads] n8n respondeu ${response.status} para lead ${insertedLead.id}`
        );
      }
    } catch (err) {
      console.error('[api/leads] falha ao chamar n8n:', err);
    } finally {
      clearTimeout(timer);
    }
  }

  return NextResponse.json(
    { success: true, leadId: insertedLead.id },
    { status: 201 }
  );
}
