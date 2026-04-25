import type { Metadata } from 'next';
import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuthSession } from '@/lib/painel/session';
import { getActiveCampaign, getAllCampaigns } from '@/lib/painel/campaign-resolver';
import { CampaignSelector } from '@/components/painel/CampaignSelector';
import { BlastForm } from '@/components/painel/BlastForm';
import type { ParticipationType } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Disparar — Divulgacam',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { campanha?: string };
}

export default async function DispararPage({ searchParams }: PageProps) {
  const { manager } = await requireAuthSession();
  const isAdmin = manager.role === 'master' || manager.role === 'gestor';

  const campaign = await getActiveCampaign(manager, searchParams);
  if (!campaign) {
    return (
      <main className="px-6 py-8 sm:px-10">
        <p className="text-sm text-gray-500">Nenhuma campanha vinculada.</p>
      </main>
    );
  }

  const allCampaigns = isAdmin ? await getAllCampaigns() : [];
  const admin = supabaseAdmin();

  const TYPES: ParticipationType[] = ['apoiador', 'colaborador', 'lideranca'];

  const [totalResult, ...typeResults] = await Promise.all([
    admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id),
    ...TYPES.map((t) =>
      admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('participation_type', t),
    ),
  ]);

  const totalLeads = totalResult.count ?? 0;
  const leadCounts: Record<string, number> = {};
  TYPES.forEach((t, i) => {
    leadCounts[t] = typeResults[i].count ?? 0;
  });

  const { data: files } = await admin.storage
    .from('materiais')
    .list(campaign.id, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });

  const materiais = (files ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const path = `${campaign.id}/${f.name}`;
      const { data: { publicUrl } } = admin.storage.from('materiais').getPublicUrl(path);
      return {
        name: f.name.replace(/^\d{10,13}-/, ''),
        publicUrl,
      };
    });

  const hasWhatsApp = !!campaign.n8n_webhook_url;
  const hasResend = !!process.env.RESEND_API_KEY;

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">Disparar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Envie uma mensagem para os leads da campanha{' '}
          <strong>{campaign.name}</strong>.
        </p>
      </header>

      {isAdmin && (
        <Suspense>
          <CampaignSelector campaigns={allCampaigns} activeCampaignId={campaign.id} />
        </Suspense>
      )}

      <div className="max-w-2xl">
        {totalLeads === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm text-gray-500">
              Nenhum lead cadastrado ainda. Compartilhe o link{' '}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                /{campaign.slug}
              </code>{' '}
              para começar a captar.
            </p>
          </div>
        ) : (
          <BlastForm
            leadCounts={leadCounts}
            totalLeads={totalLeads}
            materiais={materiais}
            hasWhatsApp={hasWhatsApp}
            hasResend={hasResend}
          />
        )}
      </div>
    </main>
  );
}
