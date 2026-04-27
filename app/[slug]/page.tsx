import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingHeader } from '@/components/LandingHeader';
import { LeadForm } from '@/components/LeadForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Campaign } from '@/lib/supabase/types';

interface PageProps {
  params: { slug: string };
}

async function getCampaign(slug: string): Promise<Campaign | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[landing] erro ao buscar campanha:', error.message);
    return null;
  }
  return data as Campaign | null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const campaign = await getCampaign(params.slug);
  if (!campaign) {
    return { title: 'Campanha não encontrada — Divulgacam' };
  }
  const title = campaign.candidate_name
    ? `${campaign.candidate_name} — ${campaign.name}`
    : campaign.name;
  return {
    title,
    description: `Faça parte da campanha ${campaign.name}.`,
    openGraph: {
      title,
      description: `Faça parte da campanha ${campaign.name}.`,
      ...(campaign.logo_url ? { images: [campaign.logo_url] } : {}),
    },
  };
}

export default async function CampaignLandingPage({ params }: PageProps) {
  const campaign = await getCampaign(params.slug);
  if (!campaign) notFound();

  const primaryColor = campaign.primary_color || '#E84C22';

  return (
    <main className="min-h-screen">
      <LandingHeader
        candidateName={campaign.candidate_name}
        campaignName={campaign.name}
        logoUrl={campaign.logo_url}
      />

      <section className="bg-brand-dark text-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-10 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col justify-center space-y-5">
            <p
              className="inline-block w-fit rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: primaryColor }}
            >
              {campaign.name}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Quero participar
            </h1>
            <p className="text-lg text-white/80">
              Cadastre-se para receber conteúdos, atualizações e materiais
              oficiais da campanha direto no seu WhatsApp.
            </p>
          </div>

          <div>
            <LeadForm
              campaignId={campaign.id}
              campaignSlug={campaign.slug}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </section>

      <footer className="bg-brand-light py-6">
        <p className="mx-auto max-w-5xl px-6 text-center text-xs text-gray-500">
          Seus dados são utilizados exclusivamente pela equipe da campanha{' '}
          <strong>{campaign.name}</strong> e não serão compartilhados com
          terceiros. Plataforma Divulgacam · Tayrone Films.
        </p>
      </footer>
    </main>
  );
}
