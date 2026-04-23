'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  updateCampaign,
  type SettingsActionState,
} from '@/app/painel/configuracoes/actions';
import type { Campaign } from '@/lib/supabase/types';

const initial: SettingsActionState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Salvando…' : 'Salvar alterações'}
    </button>
  );
}

interface Props {
  campaign: Campaign;
}

export function CampaignSettingsForm({ campaign }: Props) {
  const [state, action] = useFormState(updateCampaign, initial);

  return (
    <form
      action={action}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Nome da campanha */}
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-semibold text-brand-dark"
        >
          Nome da campanha <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={120}
          defaultValue={campaign.name}
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      {/* Nome do candidato */}
      <div>
        <label
          htmlFor="candidate_name"
          className="mb-1 block text-sm font-semibold text-brand-dark"
        >
          Nome do candidato
        </label>
        <input
          id="candidate_name"
          type="text"
          name="candidate_name"
          maxLength={120}
          defaultValue={campaign.candidate_name ?? ''}
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      {/* Cor primária */}
      <div>
        <label
          htmlFor="primary_color"
          className="mb-1 block text-sm font-semibold text-brand-dark"
        >
          Cor primária
        </label>
        <div className="flex items-center gap-3">
          <input
            id="primary_color"
            type="color"
            name="primary_color"
            defaultValue={campaign.primary_color}
            className="h-10 w-16 cursor-pointer rounded-md border border-gray-300 p-0.5"
          />
          <span className="text-xs text-gray-500">
            Aparece nos botões da landing page e no painel.
          </span>
        </div>
      </div>

      {/* Webhook n8n */}
      <div>
        <label
          htmlFor="n8n_webhook_url"
          className="mb-1 block text-sm font-semibold text-brand-dark"
        >
          URL do webhook n8n
        </label>
        <input
          id="n8n_webhook_url"
          type="url"
          name="n8n_webhook_url"
          maxLength={500}
          defaultValue={campaign.n8n_webhook_url ?? ''}
          placeholder="https://n8n.seudominio.com.br/webhook/..."
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <p className="mt-1 text-xs text-gray-500">
          Endpoint que recebe os leads em tempo real via POST.
        </p>
      </div>

      {/* Instância WhatsApp (Evolution API) */}
      <div>
        <label
          htmlFor="whatsapp_instance"
          className="mb-1 block text-sm font-semibold text-brand-dark"
        >
          Instância WhatsApp (Evolution API)
        </label>
        <input
          id="whatsapp_instance"
          type="text"
          name="whatsapp_instance"
          maxLength={120}
          defaultValue={campaign.whatsapp_instance ?? ''}
          placeholder="nome-da-instancia"
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <p className="mt-1 text-xs text-gray-500">
          Nome da instância configurada no Evolution API. Usado pelo n8n para enviar WhatsApp.
        </p>
      </div>

      {/* E-mail remetente */}
      <div>
        <label
          htmlFor="email_from"
          className="mb-1 block text-sm font-semibold text-brand-dark"
        >
          E-mail remetente
        </label>
        <input
          id="email_from"
          type="email"
          name="email_from"
          maxLength={200}
          defaultValue={campaign.email_from ?? ''}
          placeholder="contato@suacampanha.com.br"
          className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <p className="mt-1 text-xs text-gray-500">
          Deixe em branco para usar o padrão definido na variável <code className="text-xs">RESEND_FROM_EMAIL</code>.
        </p>
      </div>

      {/* Informações somente-leitura */}
      <div className="rounded-md bg-gray-50 px-4 py-3">
        <p className="text-xs text-gray-500">
          <strong>Slug público:</strong>{' '}
          <code className="rounded bg-white px-1.5 py-0.5 text-[11px] border border-gray-200">
            /{campaign.slug}
          </code>{' '}
          — não pode ser alterado após a criação.
        </p>
      </div>

      {/* Feedback */}
      {state.error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Configurações salvas com sucesso.
        </div>
      )}

      <div className="flex justify-end pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
