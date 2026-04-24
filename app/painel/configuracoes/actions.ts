'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireManagerSession } from '@/lib/painel/session';
import type { Database } from '@/lib/supabase/database.types';

type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export interface SettingsActionState {
  error: string | null;
  success: boolean;
}

export async function updateCampaign(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { campaign } = await requireManagerSession();

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
    .update(payload as never) // Supabase TS inference workaround
    .eq('id', campaign.id);

  if (error) return { error: error.message, success: false };

  // Invalida dashboard, configurações e landing pública
  revalidatePath('/painel');
  revalidatePath('/painel/configuracoes');
  revalidatePath(`/${campaign.slug}`);

  return { error: null, success: true };
}
