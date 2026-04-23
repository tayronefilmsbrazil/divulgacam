import type { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — Divulgacam',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: { redirect?: string };
}

export default function LoginPage({ searchParams }: PageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-brand-dark">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Divulgacam</h1>
            <p className="mt-2 text-sm text-white/70">
              Acesso do gestor da campanha
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
            <LoginForm redirectTo={searchParams.redirect} />
          </div>

          <p className="text-center text-xs text-white/50">
            Esqueceu a senha? Entre em contato com o administrador.
          </p>
        </div>
      </div>
    </main>
  );
}
