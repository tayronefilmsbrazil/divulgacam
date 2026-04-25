'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import {
  createCampaign,
  type CreateCampaignState,
} from '@/app/painel/campanhas/actions';

const initial: CreateCampaignState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Criando...' : 'Criar campanha'}
    </button>
  );
}

export function CreateCampaignForm() {
  const [state, action] = useFormState(createCampaign, initial);
  const [name, setName] = useState('');

  // Auto-generate slug from name
  const autoSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return (
    <form
      action={action}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-brand-dark">
          Nome da campanha <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Campanha João 2026"
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-semibold text-brand-dark">
          Slug (URL pública) <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">/</span>
          <input
            id="slug"
            type="text"
            name="slug"
            required
            minLength={2}
            maxLength={60}
            pattern="[a-z0-9\-]+"
            defaultValue={autoSlug}
            key={autoSlug}
            placeholder="campanha-joao-2026"
            className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Apenas letras minúsculas, números e hífens. Não pode ser alterado depois.
        </p>
      </div>

      <div>
        <label htmlFor="candidate_name" className="mb-1 block text-sm font-semibold text-brand-dark">
          Nome do candidato
        </label>
        <input
          id="candidate_name"
          type="text"
          name="candidate_name"
          maxLength={120}
          placeholder="Opcional"
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label htmlFor="primary_color" className="mb-1 block text-sm font-semibold text-brand-dark">
          Cor primária
        </label>
        <div className="flex items-center gap-3">
          <input
            id="primary_color"
            type="color"
            name="primary_color"
            defaultValue="#E84C22"
            className="h-10 w-16 cursor-pointer rounded-md border border-gray-300 p-0.5"
          />
          <span className="text-xs text-gray-500">
            Aparece nos botões da landing page.
          </span>
        </div>
      </div>

      {state.error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
