import type { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireManagerSession } from '@/lib/painel/session';
import type { Blast, BlastChannel, BlastStatus } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Histórico — Divulgacam',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const CHANNEL_LABEL: Record<BlastChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  both: 'Ambos',
};

const STATUS_CONFIG: Record<
  BlastStatus,
  { label: string; classes: string }
> = {
  pending:   { label: 'Aguardando',  classes: 'bg-gray-100  text-gray-600'  },
  sending:   { label: 'Enviando…',   classes: 'bg-blue-100  text-blue-700'  },
  completed: { label: 'Concluído',   classes: 'bg-green-100 text-green-700' },
  failed:    { label: 'Falhou',      classes: 'bg-red-100   text-red-700'   },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function HistoricoPage() {
  const { campaign } = await requireManagerSession();
  const supabase = createSupabaseServerClient();

  const { data: blastsRaw } = await supabase
    .from('blasts')
    .select(
      'id, channel, message, total_recipients, sent_count, failed_count, status, created_at, completed_at, filters',
    )
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const blasts = (blastsRaw ?? []) as Blast[];

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-brand-dark">Histórico de Disparos</h1>
        <p className="mt-1 text-sm text-gray-600">
          {blasts.length === 0
            ? 'Nenhum disparo realizado ainda.'
            : `${blasts.length} ${blasts.length === 1 ? 'disparo' : 'disparos'} registrados.`}
        </p>
      </header>

      {blasts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-14 text-center">
          <p className="text-3xl">📡</p>
          <p className="mt-2 text-sm text-gray-400">
            Nenhum disparo realizado. Acesse{' '}
            <a href="/painel/disparar" className="text-brand-primary underline">
              Disparar
            </a>{' '}
            para enviar sua primeira mensagem.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Mensagem</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Enviados</th>
                  <th className="px-4 py-3 text-right">Falhas</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {blasts.map((blast) => {
                  const { label, classes } = STATUS_CONFIG[blast.status];
                  return (
                    <tr
                      key={blast.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(blast.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {CHANNEL_LABEL[blast.channel]}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p
                          className="truncate text-gray-700"
                          title={blast.message}
                        >
                          {blast.message}
                        </p>
                        {blast.filters &&
                          Object.keys(blast.filters).length > 0 && (
                            <p className="text-xs text-gray-400">
                              Filtro: {blast.filters['participation_type']}
                            </p>
                          )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {blast.total_recipients.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">
                        {blast.sent_count.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {blast.failed_count > 0
                          ? blast.failed_count.toLocaleString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
                        >
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legenda para status "Enviando" */}
      {blasts.some((b) => b.status === 'sending') && (
        <p className="mt-4 text-xs text-gray-400">
          ℹ️ Disparos com status <strong>Enviando…</strong> estão sendo processados pelo n8n.
          Atualize a página para ver o progresso.
        </p>
      )}
    </main>
  );
}
