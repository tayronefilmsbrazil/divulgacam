import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
          Erro 404
        </p>
        <h1 className="text-3xl font-bold text-brand-dark">Campanha não encontrada</h1>
        <p className="text-gray-600">
          O endereço que você acessou não corresponde a nenhuma campanha ativa.
          Confira o link e tente novamente.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-brand-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
