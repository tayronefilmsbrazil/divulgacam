import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireManagerSession } from '@/lib/painel/session';
import { LeadsFilter } from '@/components/painel/LeadsFilter';
import { Pagination } from '@/components/painel/Pagination';
import type { Lead, ParticipationType } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Leads — Divulgacam',
  robots: { index: false, follow: false },
};

const PER_PAGE = 25;

const TYPE_LABEL: Record<ParticipationType, string> = {
  apoiador: 'Apoiador',
  colaborador: 'Colaborador',
  lideranca: 'Liderança',
};

const TYPE_COLORS: Record<ParticipationType, string> = {
  apoiador: 'bg-blue-100 text-blue-800',
  colaborador: 'bg-green-100 text-green-800',
  lideranca: 'bg-purple-100 text-purple-800',
};

interface PageProps {
  searchParams: {
    page?: string;
    tipo?: string;
    q?: string;
  };
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { campaign } = await requireManagerSession();
  const supabase = createSupabaseServerClient();

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const tipo =
    searchParams.tipo &&
    ['apoiador', 'colaborador', 'lideranca'].includes(searchParams.tipo)
      ? (searchParams.tipo as ParticipationType)
      : undefined;
  const q = searchParams.q?.trim() || undefined;

  const offset = (page - 1) * PER_PAGE;

  let query = supabase
    .from('leads')
    .select('id, name, whatsapp, email, participation_type, created_at', {
      count: 'exact',
    })
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (tipo) query = query.eq('participation_type', tipo);
  if (q) query = query.ilike('name', `%${q}%`);

  const { data: leadsData, count } = await query;
  const leads = (leadsData as Lead[] | null) ?? [];
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  const exportUrl = `/api/leads/export`;

  return (
    <main className="px-6 py-8 sm:px-10">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Leads</h1>
          <p className="mt-1 text-sm text-gray-600">
            {count !== null ? (
              <>
                <strong>{count.toLocaleString('pt-BR')}</strong>{' '}
                {count === 1 ? 'lead captado' : 'leads captados'}
                {(tipo || q) && (
                  <span className="ml-1 text-gray-400">(filtrado)</span>
                )}
              </>
            ) : (
              'Carregando…'
            )}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href="/painel/leads/importar"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand-primary hover:text-brand-primary"
          >
            ↑ Importar
          </Link>
          <a
            href={exportUrl}
            download
            className="inline-flex items-center gap-2 rounded-md border border-brand-primary bg-white px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
          >
            ↓ Exportar CSV
          </a>
        </div>
      </header>

      {/* Filtros */}
      <Suspense>
        <LeadsFilter currentTipo={tipo} currentQ={q} />
      </Suspense>

      {/* Tabela */}
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {leads.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            {q || tipo
              ? 'Nenhum lead encontrado para os filtros selecionados.'
              : 'Nenhum lead captado ainda. Compartilhe o link da campanha para começar.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 whitespace-nowrap">Data</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{lead.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="hover:text-brand-primary hover:underline"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[lead.participation_type]}`}
                      >
                        {TYPE_LABEL[lead.participation_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Suspense>
            <Pagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </div>
      )}
    </main>
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
