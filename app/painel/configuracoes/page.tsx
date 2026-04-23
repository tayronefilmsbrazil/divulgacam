import type { Metadata } from 'next';
import { requireManagerSession } from '@/lib/painel/session';
import { CampaignSettingsForm } from '@/components/painel/CampaignSettingsForm';

export const metadata: Metadata = {
  title: 'Configurações — Divulgacam',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const { campaign } = await requireManagerSession();

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-brand-dark">Configurações</h1>
        <p className="mt-1 text-sm text-gray-600">
          Dados públicos e integrações da campanha{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
            /{campaign.slug}
          </code>
          .
        </p>
      </header>

      <div className="max-w-2xl">
        <CampaignSettingsForm campaign={campaign} />
      </div>
    </main>
  );
}
