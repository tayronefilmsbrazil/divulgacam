'use client';

import { deleteMaterial } from '@/app/painel/materiais/actions';

interface Props {
  path: string;
  displayName: string;
}

export function DeleteMaterialForm({ path, displayName }: Props) {
  return (
    <form
      action={deleteMaterial.bind(null, path)}
      onSubmit={(e) => {
        if (!confirm(`Excluir "${displayName}"? Esta ação não pode ser desfeita.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        title="Excluir arquivo"
        className="rounded bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
      >
        ✕
      </button>
    </form>
  );
}
