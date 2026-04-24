'use client';

import { deleteLead } from '@/app/painel/leads/actions';

interface Props {
  leadId: string;
  leadName: string;
}

export function DeleteLeadForm({ leadId, leadName }: Props) {
  return (
    <form
      action={deleteLead.bind(null, leadId)}
      onSubmit={(e) => {
        if (!confirm(`Excluir "${leadName}"? Esta ação não pode ser desfeita.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        title="Excluir lead"
        className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-50 hover:text-red-600"
      >
        ✕
      </button>
    </form>
  );
}
