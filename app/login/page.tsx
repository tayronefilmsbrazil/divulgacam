import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — Divulgacam',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: { redirect?: string; erro?: string };
}

const ERRORS: Record<string, string> = {
  'sem-conta': 'Conta não encontrada. Cadastre-se primeiro.',
  'rejeitado': 'Sua conta foi recusada pelo administrador.',
  'sem-campanha': 'Sua conta não está vinculada a nenhuma campanha.',
};

export default function LoginPage({ searchParams }: PageProps) {
  const errorMsg = searchParams.erro ? ERRORS[searchParams.erro] : undefined;

  return (
    <main className="flex min-h-screen flex-col bg-brand-dark">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">
              Divulga<span className="text-[#E84C22]">cam</span>
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Acesso ao painel de gestão
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
            {errorMsg && (
              <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {errorMsg}
              </div>
            )}
            <LoginForm redirectTo={searchParams.redirect} />
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm text-white/60">
              Não tem conta?{' '}
              <Link
                href="/cadastro"
                className="font-semibold text-[#E84C22] hover:underline"
              >
                Criar conta
              </Link>
            </p>
            <p className="text-xs text-white/40">
              Após o cadastro, aguarde a aprovação de um gestor.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
