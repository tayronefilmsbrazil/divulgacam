import type { Metadata } from 'next';
import Link from 'next/link';
import { requireGestorSession } from '@/lib/painel/session';
import { CreateCampaignForm } from '@/components/painel/CreateCampaignForm';

export const metadata: Metadata = {
  title: 'Nova campanha — Divulgacam',
  robots: { index: false, follow: false },
};

export default async function NovaCampanhaPage() {
  await requireGestorSession();

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
        <h1 className="text-3xl font-bold text-brand-dark">Nova campanha</h1>
        <p className="mt-1 text-sm text-gray-600">
          Preencha os dados para criar uma nova campanha.
        </p>
      </header>

      <div className="max-w-2xl">
        <CreateCampaignForm />
      </div>
    </main>
  );
}
