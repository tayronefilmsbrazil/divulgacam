import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Campaign, ManagerRole, ManagerStatus } from '@/lib/supabase/types';
import type { Database } from '@/lib/supabase/database.types';

type ManagerRow = Pick<
  Database['public']['Tables']['managers']['Row'],
  'id' | 'name' | 'email' | 'campaign_id' | 'role' | 'status'
>;

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
 * Does NOT require a campaign or approved status — use for layout-level checks.
 */
export async function requireAuthSession(): Promise<AuthSession> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: manager, error: managerError } = (await supabase
    .from('managers')
    .select('id, name, email, campaign_id, role, status')
    .eq('id', user.id)
    .maybeSingle()) as unknown as { data: ManagerRow | null; error: { message: string } | null };

  if (managerError) {
    console.error('[session] erro ao buscar manager:', managerError.message);
  }

  if (!manager) {
    await supabase.auth.signOut();
    redirect('/login?erro=sem-conta');
  }

  if (manager.status === 'pending') {
    redirect('/aguardando');
  }

  if (manager.status === 'rejected') {
    await supabase.auth.signOut();
    redirect('/login?erro=rejeitado');
  }

  return {
    manager: {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      campaign_id: manager.campaign_id,
      role: manager.role,
      status: manager.status,
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

/** Check if current manager is the master (tayrone@tayronefilms.com) */
export function isMaster(role: ManagerRole): boolean {
  return role === 'master';
}
