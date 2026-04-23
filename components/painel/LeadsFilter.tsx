'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useTransition } from 'react';
import type { ParticipationType } from '@/lib/supabase/types';

interface LeadsFilterProps {
  currentTipo?: ParticipationType;
  currentQ?: string;
}

const TIPOS: { value: ParticipationType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'apoiador', label: 'Apoiador' },
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'lideranca', label: 'Liderança' },
];

export function LeadsFilter({ currentTipo, currentQ }: LeadsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // volta para página 1 ao filtrar
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateParam('q', value), 400);
    },
    [updateParam],
  );

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}
    >
      {/* Busca por nome */}
      <div className="flex-1">
        <input
          type="search"
          placeholder="Buscar por nome…"
          defaultValue={currentQ ?? ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      {/* Filtro de tipo de participação */}
      <div className="flex flex-wrap gap-1.5">
        {TIPOS.map(({ value, label }) => {
          const isActive = (currentTipo ?? '') === value;
          return (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => updateParam('tipo', value)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'border border-gray-300 text-gray-600 hover:border-brand-primary hover:text-brand-primary bg-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
