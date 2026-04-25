import { Sidebar } from '@/components/painel/Sidebar';
import { requireAuthSession } from '@/lib/painel/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { manager } = await requireAuthSession();

  let campaignName: string | null = null;

  if (manager.campaign_id) {
    const admin = supabaseAdmin();
    const { data: campaign } = await admin
      .from('campaigns')
      .select('name')
      .eq('id', manager.campaign_id)
      .maybeSingle();
    campaignName = (campaign as { name: string } | null)?.name ?? null;
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
