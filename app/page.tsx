export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-lg space-y-4">
        <h1 className="text-4xl font-bold text-brand-dark">Divulgacam</h1>
        <p className="text-gray-600">
          Central de conteúdos de campanha. Acesse sua campanha via{' '}
          <code className="rounded bg-gray-200 px-2 py-1">/[slug]</code>.
        </p>
        <p className="text-sm text-gray-500">
          Exemplo: <code>/demo</code>
        </p>
      </div>
    </main>
  );
}
