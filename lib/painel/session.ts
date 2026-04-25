import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Campaign, ManagerRole, ManagerStatus } from '@/lib/supabase/types';

export interface AuthSession {
  manager: {
    id: string;
    name: string | null;
    email: string;
    campaign_id: string | null;
    role: ManagerRole;
    status: ManagerStatus;
  };
}

export interface PainelSession extends AuthSession {
  manager: AuthSession['manager'] & { campaign_id: string };
  campaign: Campaign;
}

export interface GestorSession extends AuthSession {
  manager: AuthSession['manager'] & { role: 'master' | 'gestor' };
}

/**
 * Returns the authenticated manager record, or redirects.
 * Uses admin client (service_role) for the managers lookup to bypass RLS
 * — authentication is already verified via supabase.auth.getUser().
 */
export async function requireAuthSession(): Promise<AuthSession> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use admin client to bypass RLS (auth already verified above)
  const admin = supabaseAdmin();
  const { data: managerRaw, error: managerError } = await admin
    .from('managers')
    .select('id, name, email, campaign_id, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (managerError) {
    console.error('[session] erro ao buscar manager:', managerError.message);
  }

  if (!managerRaw) {
    await supabase.auth.signOut();
    redirect('/login?erro=sem-conta');
  }

  const role = (managerRaw.role as ManagerRole) ?? 'user';
  const status = (managerRaw.status as ManagerStatus) ?? 'approved';

  if (status === 'pending') {
    redirect('/aguardando');
  }

  if (status === 'rejected') {
    await supabase.auth.signOut();
    redirect('/login?erro=rejeitado');
  }

  return {
    manager: {
      id: managerRaw.id as string,
      name: managerRaw.name as string | null,
      email: managerRaw.email as string,
      campaign_id: managerRaw.campaign_id as string | null,
      role,
      status,
    },
  };
}

/**
 * Requires approved manager WITH a campaign assigned.
 * Used for campaign-scoped pages (dashboard, leads, materiais, etc.)
 */
export async function requireManagerSession(): Promise<PainelSession> {
  const auth = await requireAuthSession();

  if (!auth.manager.campaign_id) {
    redirect('/painel?sem-campanha=1');
  }

  const supabase = createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', auth.manager.campaign_id)
    .maybeSingle();

  if (!campaign) {
    redirect('/painel?campanha-removida=1');
  }

  return {
    manager: { ...auth.manager, campaign_id: auth.manager.campaign_id },
    campaign: campaign as Campaign,
  };
}

/**
 * Requires gestor or master role. Used for admin pages (usuarios, campanhas).
 */
export async function requireGestorSession(): Promise<GestorSession> {
  const auth = await requireAuthSession();

  if (auth.manager.role !== 'master' && auth.manager.role !== 'gestor') {
    redirect('/painel');
  }

  return {
    manager: auth.manager as GestorSession['manager'],
  };
}
