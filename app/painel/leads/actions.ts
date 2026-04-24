'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireManagerSession } from '@/lib/painel/session';

export async function deleteLead(leadId: string): Promise<void> {
  const { campaign } = await requireManagerSession();

  // Garante que o lead pertence à campanha do gestor logado
  const admin = supabaseAdmin();
  const { data: lead } = await admin
    .from('leads')
    .select('campaign_id')
    .eq('id', leadId)
    .maybeSingle();

  if (!lead || lead.campaign_id !== campaign.id) {
    throw new Error('Acesso negado.');
  }

  const { error } = await admin.from('leads').delete().eq('id', leadId);
  if (error) throw new Error(error.message);

  revalidatePath('/painel/leads');
  revalidatePath('/painel');
}
