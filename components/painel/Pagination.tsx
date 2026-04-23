'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  // Gera lista de páginas próximas com ellipsis
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div
      className={`flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-sm transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}
    >
      <span className="text-gray-500">
        Página <strong>{currentPage}</strong> de{' '}
        <strong>{totalPages}</strong>
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Anterior
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={`min-w-[2rem] rounded-md px-2 py-1.5 transition ${
                p === currentPage
                  ? 'bg-brand-primary font-bold text-white'
                  : 'border border-gray-300 text-gray-600 hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
