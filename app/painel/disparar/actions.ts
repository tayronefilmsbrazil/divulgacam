'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireManagerSession } from '@/lib/painel/session';
import type { ParticipationType, BlastChannel } from '@/lib/supabase/types';
import type { Database } from '@/lib/supabase/database.types';

type LeadRow = Pick<
  Database['public']['Tables']['leads']['Row'],
  'id' | 'name' | 'whatsapp' | 'email' | 'participation_type'
>;

export interface BlastFormState {
  error: string | null;
}

// ── Helpers ───────────────────────────────────────────────────

/** Converte (82) 98765-4321 → 5582987654321 para Evolution API */
function toE164Brazil(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

/** Substitui variáveis {nome} e {candidato} na mensagem */
function interpolate(
  template: string,
  vars: { nome: string; candidato: string },
): string {
  return template
    .replace(/\{nome\}/gi, vars.nome)
    .replace(/\{candidato\}/gi, vars.candidato);
}

/** HTML simples para e-mail */
function buildEmailHtml(opts: {
  campaignName: string;
  candidateName: string | null;
  message: string;
  materialUrl: string | null;
}): string {
  const safeMsg = opts.message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const materialBlock = opts.materialUrl
    ? `<p style="margin-top:16px">
        <a href="${opts.materialUrl}" style="color:#E84C22;font-weight:bold">
          📎 Ver material da campanha
        </a>
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <p>${safeMsg}</p>
  ${materialBlock}
  <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
  <p style="font-size:12px;color:#999">
    Mensagem enviada pela campanha <strong>${opts.campaignName}</strong>.
  </p>
</body>
</html>`;
}

// ── Server Action principal ───────────────────────────────────

export async function createBlast(
  _prev: BlastFormState,
  formData: FormData,
): Promise<BlastFormState> {
  const { campaign, manager } = await requireManagerSession();

  // — Inputs —
  const channel = formData.get('channel') as BlastChannel | null;
  const participationType = (formData.get('participation_type') as string | null) || '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';
  const materialUrl = (formData.get('material_url') as string | null)?.trim() || null;

  // — Validação básica —
  if (!channel || !['whatsapp', 'email', 'both'].includes(channel)) {
    return { error: 'Selecione um canal de envio.' };
  }
  if (message.length < 5) {
    return { error: 'Mensagem muito curta (mínimo 5 caracteres).' };
  }

  const supabase = createSupabaseServerClient();

  // — Busca leads —
  let leadsQuery = supabase
    .from('leads')
    .select('id, name, whatsapp, email, participation_type')
    .eq('campaign_id', campaign.id);

  if (participationType) {
    leadsQuery = leadsQuery.eq(
      'participation_type',
      participationType as ParticipationType,
    );
  }

  const { data: leadsRaw } = await leadsQuery;
  const leads = (leadsRaw ?? []) as LeadRow[];

  if (leads.length === 0) {
    return { error: 'Nenhum destinatário encontrado com os filtros selecionados.' };
  }

  if (channel !== 'whatsapp' && leads.filter((l) => l.email).length === 0) {
    return { error: 'Nenhum lead possui e-mail cadastrado para este filtro.' };
  }

  // — Cria registro de blast —
  const filters: Record<string, string> = {};
  if (participationType) filters['participation_type'] = participationType;

  const blastInsert: Database['public']['Tables']['blasts']['Insert'] = {
    campaign_id: campaign.id,
    manager_id: manager.id,
    channel,
    message,
    material_url: materialUrl,
    filters,
    total_recipients: leads.length,
    status: 'sending',
  };

  const { data: blastRaw } = (await supabase
    .from('blasts')
    .insert(blastInsert as never)
    .select('id')
    .single()) as unknown as { data: { id: string } | null };

  if (!blastRaw) {
    return { error: 'Erro ao registrar o disparo. Tente novamente.' };
  }

  const blastId = blastRaw.id;
  let emailSent = 0;
  let emailFailed = 0;

  // ══ CANAL: E-MAIL (Resend direto) ══════════════════════════

  if (channel === 'email' || channel === 'both') {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      await supabaseAdmin()
        .from('blasts')
        .update({ status: 'failed' } as never)
        .eq('id', blastId);
      return { error: 'RESEND_API_KEY não configurado. Configure em Variáveis de Ambiente.' };
    }

    const resend = new Resend(resendKey);
    const fromEmail =
      campaign.email_from ||
      process.env.RESEND_FROM_EMAIL ||
      'contato@divulgacam.com.br';

    const emailLeads = leads.filter((l) => !!l.email);
    const CHUNK = 100; // limite do batch Resend

    for (let i = 0; i < emailLeads.length; i += CHUNK) {
      const chunk = emailLeads.slice(i, i + CHUNK);
      const emails = chunk.map((lead) => {
        const personalMsg = interpolate(message, {
          nome: lead.name,
          candidato: campaign.candidate_name ?? campaign.name,
        });
        return {
          from: fromEmail,
          to: lead.email!,
          subject: `${campaign.candidate_name ?? campaign.name} — Mensagem Importante`,
          html: buildEmailHtml({
            campaignName: campaign.name,
            candidateName: campaign.candidate_name,
            message: personalMsg,
            materialUrl,
          }),
        };
      });

      try {
        await resend.batch.send(emails);
        emailSent += chunk.length;
      } catch {
        emailFailed += chunk.length;
      }
    }
  }

  // ══ CANAL: WHATSAPP (delega ao n8n → Evolution API) ════════

  let whatsappQueued = false;

  if (channel === 'whatsapp' || channel === 'both') {
    const webhookUrl = campaign.n8n_webhook_url;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'disparo_whatsapp',
            blast_id: blastId,
            campaign_id: campaign.id,
            campaign_slug: campaign.slug,
            whatsapp_instance: campaign.whatsapp_instance,
            message,
            material_url: materialUrl,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/blasts/update`,
            leads: leads.map((l) => ({
              id: l.id,
              nome: l.name,
              numero: toE164Brazil(l.whatsapp),
            })),
          }),
          signal: AbortSignal.timeout(8000),
        });
        whatsappQueued = true;
      } catch {
        // n8n offline ou timeout — registra como falha parcial
      }
    }
  }

  // — Atualiza status final do blast —
  const isEmailOnly = channel === 'email';
  const whatsappFailed =
    (channel === 'whatsapp' || channel === 'both') && !whatsappQueued;

  const finalStatus =
    isEmailOnly
      ? 'completed'
      : whatsappFailed
        ? 'failed'
        : 'sending';

  await supabaseAdmin()
    .from('blasts')
    .update({
      sent_count: emailSent,
      failed_count: emailFailed + (whatsappFailed ? leads.length : 0),
      status: finalStatus,
      completed_at: isEmailOnly ? new Date().toISOString() : null,
    } as never)
    .eq('id', blastId);

  revalidatePath('/painel/historico');
  redirect('/painel/historico');
}
