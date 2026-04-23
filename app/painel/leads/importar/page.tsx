import type { Metadata } from 'next';
import Link from 'next/link';
import { ImportForm } from '@/components/painel/ImportForm';

export const metadata: Metadata = {
  title: 'Importar Leads — Divulgacam',
  robots: { index: false, follow: false },
};

export default function ImportarPage() {
  return (
    <main className="px-6 py-8 sm:px-10">
      {/* Header */}
      <header className="mb-6">
        <Link
          href="/painel/leads"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-primary"
        >
          ← Voltar para Leads
        </Link>
        <h1 className="text-3xl font-bold text-brand-dark">Importar Leads</h1>
        <p className="mt-1 text-sm text-gray-600">
          Sincronize sua planilha do Google Sheets ou faça upload de um arquivo CSV.
          Leads já existentes (mesmo WhatsApp) não serão duplicados.
        </p>
      </header>

      {/* Sincronização automática */}
      <div className="mb-8 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="font-semibold text-brand-dark text-sm">Sincronização automática via n8n</p>
            <p className="mt-1 text-xs text-gray-600">
              Quando configurado, o n8n chama automaticamente o endpoint{' '}
              <code className="rounded bg-white px-1.5 py-0.5 border border-gray-200 text-[11px]">
                POST /api/leads/sync
              </code>{' '}
              a cada nova linha adicionada na planilha. Configure o secret{' '}
              <code className="rounded bg-white px-1.5 py-0.5 border border-gray-200 text-[11px]">
                LEADS_SYNC_SECRET
              </code>{' '}
              no painel do n8n e no arquivo <code className="rounded bg-white px-1.5 py-0.5 border border-gray-200 text-[11px]">.env.local</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ImportForm />
      </div>
    </main>
  );
}
