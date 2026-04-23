import { Sidebar } from '@/components/painel/Sidebar';
import { requireManagerSession } from '@/lib/painel/session';

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { manager, campaign } = await requireManagerSession();

  return (
    <div className="flex min-h-screen bg-brand-light">
      <Sidebar
        campaignName={campaign.name}
        managerName={manager.name}
        managerEmail={manager.email}
      />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
