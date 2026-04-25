'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireGestorSession } from '@/lib/painel/session';
import type { Database } from '@/lib/supabase/database.types';

type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

// ── Create Campaign ──────────────────────────────────────────────

const createSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug deve ter pelo menos 2 caracteres.')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens.'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(120),
  candidate_name: z.string().max(120).optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export interface CreateCampaignState {
  error: string | null;
}

export async function createCampaign(
  _prev: CreateCampaignState,
  formData: FormData,
): Promise<CreateCampaignState> {
  await requireGestorSession();

  const parsed = createSchema.safeParse({
    slug: formData.get('slug'),
    name: formData.get('name'),
    candidate_name: (formData.get('candidate_name') as string)?.trim() || undefined,
    primary_color: (formData.get('primary_color') as string)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const admin = supabaseAdmin();

  // Check slug uniqueness
  const { data: existing } = await admin
    .from('campaigns')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle();

  if (existing) {
    return { error: 'Este slug já está em uso. Escolha outro.' };
  }

  const { error } = await admin.from('campaigns').insert({
    slug: parsed.data.slug,
    name: parsed.data.name,
    candidate_name: parsed.data.candidate_name ?? null,
    primary_color: parsed.data.primary_color ?? '#E84C22',
  });

  if (error) return { error: error.message };

  revalidatePath('/painel/campanhas');
  redirect('/painel/campanhas');
}

// ── Update Campaign ──────────────────────────────────────────────

export interface SettingsActionState {
  error: string | null;
  success: boolean;
}

export async function updateCampaign(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireGestorSession();

  const campaignId = formData.get('campaign_id') as string;
  if (!campaignId) return { error: 'ID da campanha ausente.', success: false };

  const name = (formData.get('name') as string | null)?.trim();
  const candidateName =
    (formData.get('candidate_name') as string | null)?.trim() || null;
  const primaryColor =
    (formData.get('primary_color') as string | null)?.trim() || '#E84C22';
  const n8nWebhookUrl =
    (formData.get('n8n_webhook_url') as string | null)?.trim() || null;
  const whatsappInstance =
    (formData.get('whatsapp_instance') as string | null)?.trim() || null;
  const emailFrom =
    (formData.get('email_from') as string | null)?.trim() || null;
  const logoUrl =
    (formData.get('logo_url') as string | null)?.trim() || null;

  if (!name || name.length < 2) {
    return {
      error: 'Nome da campanha deve ter pelo menos 2 caracteres.',
      success: false,
    };
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    return { error: 'Cor primária inválida.', success: false };
  }

  const supabase = createSupabaseServerClient();
  const payload: CampaignUpdate = {
    name,
    candidate_name: candidateName,
    primary_color: primaryColor,
    logo_url: logoUrl,
    n8n_webhook_url: n8nWebhookUrl,
    whatsapp_instance: whatsappInstance,
    email_from: emailFrom,
  };

  const { error } = await supabase
    .from('campaigns')
    .update(payload as never)
    .eq('id', campaignId);

  if (error) return { error: error.message, success: false };

  revalidatePath('/painel/campanhas');
  revalidatePath(`/painel/campanhas/${campaignId}`);

  return { error: null, success: true };
}
