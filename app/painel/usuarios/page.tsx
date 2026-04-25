import type { Metadata } from 'next';
import { requireGestorSession } from '@/lib/painel/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserManagementTable } from '@/components/painel/UserManagementTable';
import type { Manager, Campaign } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Usuários — Divulgacam',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const { manager: currentManager } = await requireGestorSession();
  const admin = supabaseAdmin();

  const { data: managersRaw } = await admin
    .from('managers')
    .select('id, name, email, campaign_id, role, status, created_at')
    .order('created_at', { ascending: false });

  const managers = (managersRaw ?? []) as Manager[];

  const { data: campaignsRaw } = await admin
    .from('campaigns')
    .select('id, name, slug')
    .order('name');

  const campaigns = (campaignsRaw ?? []) as Pick<Campaign, 'id' | 'name' | 'slug'>[];

  // Build campaign lookup map
  const campaignMap: Record<string, string> = {};
  campaigns.forEach((c) => {
    campaignMap[c.id] = c.name;
  });

  const pendingCount = managers.filter((m) => m.status === 'pending').length;

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-brand-dark">Usuários</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie os usuários da plataforma.
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </header>

      <UserManagementTable
        managers={managers}
        campaigns={campaigns}
        campaignMap={campaignMap}
        currentManagerRole={currentManager.role}
        currentManagerId={currentManager.id}
      />
    </main>
  );
}
