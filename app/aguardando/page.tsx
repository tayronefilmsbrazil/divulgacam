import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aguardando aprovação — Divulgacam',
  robots: { index: false, follow: false },
};

export default function AguardandoPage() {
  return (
    <main className="flex min-h-screen flex-col bg-brand-dark">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#E84C22]/10">
            <svg
              className="h-10 w-10 text-[#E84C22]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white">
            Cadastro realizado!
          </h1>

          <div className="mt-6 rounded-xl bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-base leading-relaxed text-white/80">
              Sua conta foi criada com sucesso. Agora é necessário aguardar a
              aprovação de um gestor para acessar o painel.
            </p>
            <p className="mt-4 text-sm text-white/50">
              Você receberá acesso assim que for aprovado. Tente fazer login
              novamente mais tarde.
            </p>
          </div>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </main>
  );
}
