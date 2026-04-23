import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Campaign } from '@/lib/supabase/types';
import type { Database } from '@/lib/supabase/database.types';

type ManagerRow = Pick<
  Database['public']['Tables']['managers']['Row'],
  'id' | 'name' | 'email' | 'campaign_id'
>;

export interface PainelSession {
  manager: {
    id: string;
    name: string | null;
    email: string;
    campaign_id: string;
  };
  campaign: Campaign;
}

/**
 * Carrega a sessão completa do gestor logado para uso em Server Components
 * dentro de /painel. Redireciona para /login se não autenticado, ou /login?erro
 * se autenticado mas sem registro em managers.
 */
export async function requireManagerSession(): Promise<PainelSession> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: manager } = (await supabase
    .from('managers')
    .select('id, name, email, campaign_id')
    .eq('id', user.id)
    .maybeSingle()) as unknown as { data: ManagerRow | null; error: unknown };

  if (!manager) {
    // Usuário autenticado mas sem vínculo com campanha — deslogar e mandar login.
    await supabase.auth.signOut();
    redirect('/login?erro=sem-campanha');
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', manager.campaign_id)
    .maybeSingle();

  if (!campaign) {
    await supabase.auth.signOut();
    redirect('/login?erro=campanha-removida');
  }

  return {
    manager: {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      campaign_id: manager.campaign_id,
    },
    campaign: campaign as Campaign,
  };
}
