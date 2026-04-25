import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuthSession } from '@/lib/painel/session';
import { getActiveCampaign, getAllCampaigns } from '@/lib/painel/campaign-resolver';
import { CampaignSelector } from '@/components/painel/CampaignSelector';
import type { ParticipationType } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Dashboard — Divulgacam',
  robots: { index: false, follow: false },
};

interface LeadRow {
  id: string;
  name: string;
  whatsapp: string;
  participation_type: ParticipationType;
  created_at: string;
}

const TYPE_LABEL: Record<ParticipationType, string> = {
  apoiador: 'Apoiadores',
  colaborador: 'Colaboradores',
  lideranca: 'Lideranças',
};

interface PageProps {
  searchParams: { campanha?: string };
}

export default async function PainelDashboard({ searchParams }: PageProps) {
  const { manager } = await requireAuthSession();
  const isAdmin = manager.role === 'master' || manager.role === 'gestor';

  const campaign = await getActiveCampaign(manager, searchParams);

  // No campaign available
  if (!campaign) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-dark">
            Nenhuma campanha vinculada
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isAdmin
              ? 'Acesse a aba Campanhas para criar ou gerenciar campanhas.'
              : 'Aguarde um gestor vincular sua conta a uma campanha.'}
          </p>
          {isAdmin && (
            <Link
              href="/painel/campanhas"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Gerenciar campanhas
            </Link>
          )}
        </div>
      </main>
    );
  }

  const allCampaigns = isAdmin ? await getAllCampaigns() : [];
  const admin = supabaseAdmin();

  const { count: totalLeads } = await admin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id);

  const countByType = await Promise.all(
    (['apoiador', 'colaborador', 'lideranca'] as ParticipationType[]).map(
      async (type) => {
        const { count } = await admin
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('participation_type', type);
        return { type, count: count ?? 0 };
      }
    )
  );

  const { data: recentLeadsData } = await admin
    .from('leads')
    .select('id, name, whatsapp, participation_type, created_at')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .limit(10);
  const recentLeads = (recentLeadsData as LeadRow[] | null) ?? [];

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Visão geral da campanha <strong>{campaign.name}</strong>
          {campaign.candidate_name && ` · ${campaign.candidate_name}`}.
        </p>
      </header>

      {isAdmin && (
        <Suspense>
          <CampaignSelector campaigns={allCampaigns} activeCampaignId={campaign.id} />
        </Suspense>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de leads" value={totalLeads ?? 0} accent />
        {countByType.map(({ type, count }) => (
          <KpiCard key={type} label={TYPE_LABEL[type]} value={count} />
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-dark">Últimos 10 leads</h2>
          <Link
            href="/painel/leads"
            className="text-sm font-medium text-brand-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {recentLeads.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              Nenhum lead cadastrado ainda. Compartilhe o link{' '}
              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                /{campaign.slug}
              </code>{' '}
              para começar.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.whatsapp}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {TYPE_LABEL[lead.participation_type]}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-5 shadow-sm ${
        accent
          ? 'border-brand-primary/30 bg-white'
          : 'border-gray-200 bg-white'
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold ${
          accent ? 'text-brand-primary' : 'text-brand-dark'
        }`}
      >
        {value.toLocaleString('pt-BR')}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
