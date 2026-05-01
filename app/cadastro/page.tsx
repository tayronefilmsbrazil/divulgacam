import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/RegisterForm';
import { BackgroundPaths } from '@/components/ui/background-paths';

export const metadata: Metadata = {
  title: 'Criar conta — Divulgacam',
  robots: { index: false, follow: false },
};

export default function CadastroPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-brand-dark overflow-hidden">
      <BackgroundPaths />
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">
              Divulga<span className="text-[#E84C22]">cam</span>
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Crie sua conta para acessar o painel
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
            <RegisterForm />
          </div>

          <p className="text-center text-sm text-white/60">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#E84C22] hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
