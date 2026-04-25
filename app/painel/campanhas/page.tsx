import type { Metadata } from 'next';
import Link from 'next/link';
import { requireGestorSession } from '@/lib/painel/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Campaign } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Campanhas — Divulgacam',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CampanhasPage() {
  await requireGestorSession();
  const admin = supabaseAdmin();

  const { data: campaignsRaw } = await admin
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  const campaigns = (campaignsRaw ?? []) as Campaign[];

  // Count leads per campaign
  const leadCounts: Record<string, number> = {};
  if (campaigns.length > 0) {
    const { data: counts } = await admin
      .from('leads')
      .select('campaign_id')
      .in(
        'campaign_id',
        campaigns.map((c) => c.id),
      );

    if (counts) {
      for (const row of counts) {
        const cid = (row as { campaign_id: string }).campaign_id;
        leadCounts[cid] = (leadCounts[cid] ?? 0) + 1;
      }
    }
  }

  // Count managers per campaign
  const managerCounts: Record<string, number> = {};
  if (campaigns.length > 0) {
    const { data: mCounts } = await admin
      .from('managers')
      .select('campaign_id')
      .eq('status', 'approved')
      .in(
        'campaign_id',
        campaigns.map((c) => c.id),
      );

    if (mCounts) {
      for (const row of mCounts) {
        const cid = (row as { campaign_id: string | null }).campaign_id;
        if (cid) managerCounts[cid] = (managerCounts[cid] ?? 0) + 1;
      }
    }
  }

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Campanhas</h1>
          <p className="mt-1 text-sm text-gray-600">
            {campaigns.length}{' '}
            {campaigns.length === 1 ? 'campanha cadastrada' : 'campanhas cadastradas'}.
          </p>
        </div>
        <Link
          href="/painel/campanhas/nova"
          className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova campanha
        </Link>
      </header>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-14 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
          <p className="mt-3 text-sm text-gray-400">
            Nenhuma campanha criada ainda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/painel/campanhas/${campaign.id}`}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand-primary/40 hover:shadow-md"
            >
              {/* Color bar */}
              <div
                className="mb-4 h-2 w-full rounded-full"
                style={{ backgroundColor: campaign.primary_color }}
              />

              <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-primary">
                {campaign.name}
              </h3>
              {campaign.candidate_name && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {campaign.candidate_name}
                </p>
              )}

              <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                  {(leadCounts[campaign.id] ?? 0).toLocaleString('pt-BR')} leads
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  {managerCounts[campaign.id] ?? 0} usuários
                </span>
                <code className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">
                  /{campaign.slug}
                </code>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
