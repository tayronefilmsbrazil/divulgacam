import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Divulgacam — Plataforma de Campanhas Políticas',
  description:
    'Capture leads, dispare mensagens no WhatsApp e e-mail, e gerencie os materiais da sua campanha em um só lugar.',
};

const features = [
  {
    icon: '📋',
    title: 'Captação de Leads',
    description:
      'Landing page personalizada para cada campanha. Apoiadores, colaboradores e lideranças em um único cadastro.',
  },
  {
    icon: '💬',
    title: 'Disparo de WhatsApp',
    description:
      'Envie mensagens personalizadas com {nome} e {candidato} para toda a sua base de contatos com um clique.',
  },
  {
    icon: '📧',
    title: 'Disparo de E-mail',
    description:
      'Envie e-mails com identidade visual da campanha, logo e link de material diretamente pelo painel.',
  },
  {
    icon: '📁',
    title: 'Gestão de Materiais',
    description:
      'Suba imagens, vídeos, PDFs e áudios da campanha e envie junto com cada disparo automaticamente.',
  },
  {
    icon: '📊',
    title: 'Histórico de Disparos',
    description:
      'Acompanhe todos os envios realizados, quantidade de destinatários e status em tempo real.',
  },
  {
    icon: '🔗',
    title: 'Integração com n8n',
    description:
      'Conecte com qualquer automação via webhook. Compatible com Z-API, Evolution API e muito mais.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans">

      {/* ── Navbar ── */}
      <header className="bg-[#1A2740] px-6 py-4 sm:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-white">
            Divulga<span className="text-[#E84C22]">cam</span>
          </span>
          <Link
            href="/login"
            className="rounded-md bg-[#E84C22] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#c93d18]"
          >
            Acessar painel
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#1A2740] px-6 pb-24 pt-20 text-center sm:px-12">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block rounded-full bg-[#E84C22]/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#E84C22]">
            Plataforma para campanhas políticas
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Sua campanha organizada,<br />
            <span className="text-[#E84C22]">seus apoiadores conectados.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-300">
            Capture leads, dispare WhatsApp e e-mail personalizados e gerencie
            todos os materiais da campanha em um só lugar.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-md bg-[#E84C22] px-8 py-3 text-base font-bold text-white shadow-lg transition hover:bg-[#c93d18]"
            >
              Acessar meu painel →
            </Link>
            <a
              href="https://wa.me/5582999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/30 px-8 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Falar com a equipe
            </a>
          </div>
        </div>
      </section>

      {/* ── Wave separator ── */}
      <div className="bg-[#1A2740]">
        <svg viewBox="0 0 1440 60" className="block w-full" preserveAspectRatio="none" height="60">
          <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" fill="#F5F5F5" />
        </svg>
      </div>

      {/* ── Features ── */}
      <section className="px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-[#1A2740]">
            Tudo que sua campanha precisa
          </h2>
          <p className="mb-12 text-center text-gray-500">
            Do cadastro ao disparo — sem complicação.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-[#1A2740]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-[#1A2740] px-6 py-16 text-center sm:px-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold text-white">
            Pronto para começar?
          </h2>
          <p className="mt-3 text-gray-300">
            Acesse o painel e gerencie sua campanha agora mesmo.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-md bg-[#E84C22] px-10 py-3 text-base font-bold text-white shadow-lg transition hover:bg-[#c93d18]"
          >
            Acessar painel →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#111c2d] px-6 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Divulgacam · Todos os direitos reservados
      </footer>

    </div>
  );
}
