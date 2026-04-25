import { Sidebar } from '@/components/painel/Sidebar';
import { requireAuthSession } from '@/lib/painel/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Campaign } from '@/lib/supabase/types';

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { manager } = await requireAuthSession();

  let campaignName: string | null = null;

  if (manager.campaign_id) {
    const supabase = createSupabaseServerClient();
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name')
      .eq('id', manager.campaign_id)
      .maybeSingle();
    campaignName = (campaign as Pick<Campaign, 'name'> | null)?.name ?? null;
  }

  return (
    <div className="flex min-h-screen bg-brand-light">
      <Sidebar
        campaignName={campaignName}
        managerName={manager.name}
        managerEmail={manager.email}
        role={manager.role}
      />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
