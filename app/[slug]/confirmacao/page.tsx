import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LandingHeader } from '@/components/LandingHeader';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Campaign } from '@/lib/supabase/types';

interface PageProps {
  params: { slug: string };
}

async function getCampaign(slug: string): Promise<Campaign | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as Campaign | null) ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const campaign = await getCampaign(params.slug);
  return {
    title: campaign
      ? `Obrigado! — ${campaign.name}`
      : 'Campanha não encontrada',
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmacaoPage({ params }: PageProps) {
  const campaign = await getCampaign(params.slug);
  if (!campaign) notFound();

  const primaryColor = campaign.primary_color || '#E84C22';
  const shareText = `Acabei de me cadastrar na campanha ${campaign.name}. Participe também:`;
  const shareUrl =
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/${campaign.slug}`
      : '';
  const waHref = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${shareUrl}`.trim()
  )}`;

  return (
    <main className="min-h-screen">
      <LandingHeader
        candidateName={campaign.candidate_name}
        campaignName={campaign.name}
        logoUrl={campaign.logo_url}
      />

      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: primaryColor }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-10 w-10 text-white"
            >
              <path
                d="M5 12l5 5 9-11"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Cadastro confirmado!
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Obrigado por fazer parte da campanha{' '}
            <strong>{campaign.name}</strong>. Em breve você receberá os
            primeiros materiais oficiais.
          </p>

          <div className="mt-8 space-y-3 sm:flex sm:justify-center sm:space-x-3 sm:space-y-0">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: primaryColor }}
              className="inline-block rounded-md px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Compartilhar no WhatsApp
            </a>
            <Link
              href={`/${campaign.slug}`}
              className="inline-block rounded-md border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Voltar à página
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-brand-light py-6">
        <p className="mx-auto max-w-5xl px-6 text-center text-xs text-gray-500">
          Plataforma Divulgacam · Tayrone Films
        </p>
      </footer>
    </main>
  );
}
