import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireGestorSession } from '@/lib/painel/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CampaignSettingsForm } from '@/components/painel/CampaignSettingsForm';
import type { Campaign } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Configurações da campanha — Divulgacam',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function CampaignConfigPage({ params }: PageProps) {
  await requireGestorSession();

  const admin = supabaseAdmin();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!campaign) {
    notFound();
  }

  // Count leads and users for this campaign
  const { count: leadCount } = await admin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id);

  const { count: userCount } = await admin
    .from('managers')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'approved');

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-6">
        <Link
          href="/painel/campanhas"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para campanhas
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: (campaign as Campaign).primary_color }}
          />
          <h1 className="text-3xl font-bold text-brand-dark">
            {(campaign as Campaign).name}
          </h1>
        </div>
        <div className="mt-2 flex gap-4 text-sm text-gray-500">
          <span>
            <strong>{(leadCount ?? 0).toLocaleString('pt-BR')}</strong> leads
          </span>
          <span>
            <strong>{userCount ?? 0}</strong> usuários vinculados
          </span>
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
            /{(campaign as Campaign).slug}
          </code>
        </div>
      </header>

      <div className="max-w-2xl">
        <CampaignSettingsForm campaign={campaign as Campaign} />
      </div>
    </main>
  );
}
