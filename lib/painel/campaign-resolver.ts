import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Campaign } from '@/lib/supabase/types';
import type { AuthSession } from './session';

/**
 * Resolves which campaign to show on a page.
 * - master/gestor: can override via ?campanha=<id> search param
 * - regular user: always uses their assigned campaign
 *
 * Returns null if no campaign is available.
 */
export async function getActiveCampaign(
  manager: AuthSession['manager'],
  searchParams: { campanha?: string },
): Promise<Campaign | null> {
  const isAdmin = manager.role === 'master' || manager.role === 'gestor';
  const admin = supabaseAdmin();

  // Admin with explicit campaign selection
  if (isAdmin && searchParams.campanha) {
    const { data } = await admin
      .from('campaigns')
      .select('*')
      .eq('id', searchParams.campanha)
      .maybeSingle();
    if (data) return data as Campaign;
  }

  // Fall back to assigned campaign
  if (manager.campaign_id) {
    const { data } = await admin
      .from('campaigns')
      .select('*')
      .eq('id', manager.campaign_id)
      .maybeSingle();
    if (data) return data as Campaign;
  }

  // Admin with no campaign selected — return first available
  if (isAdmin) {
    const { data } = await admin
      .from('campaigns')
      .select('*')
      .order('name')
      .limit(1)
      .maybeSingle();
    if (data) return data as Campaign;
  }

  return null;
}

/**
 * Fetches all campaigns for the selector dropdown.
 */
export async function getAllCampaigns(): Promise<Pick<Campaign, 'id' | 'name' | 'slug'>[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from('campaigns')
    .select('id, name, slug')
    .order('name');
  return (data ?? []) as Pick<Campaign, 'id' | 'name' | 'slug'>[];
}
