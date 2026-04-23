'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createBlast, type BlastFormState } from '@/app/painel/disparar/actions';
import type { ParticipationType } from '@/lib/supabase/types';

const initial: BlastFormState = { error: null };

const CHANNEL_OPTIONS = [
  {
    value: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    desc: 'Enviado via n8n + Evolution API',
  },
  {
    value: 'email',
    label: 'E-mail',
    icon: '✉️',
    desc: 'Enviado via Resend (leads com e-mail)',
  },
  {
    value: 'both',
    label: 'Ambos',
    icon: '📣',
    desc: 'WhatsApp + E-mail simultaneamente',
  },
];

const TYPE_OPTIONS: { value: ParticipationType | ''; label: string }[] = [
  { value: '', label: 'Todos os leads' },
  { value: 'apoiador', label: 'Apoiadores' },
  { value: 'colaborador', label: 'Colaboradores' },
  { value: 'lideranca', label: 'Lideranças' },
];

interface BlastFormProps {
  leadCounts: Record<string, number>;
  totalLeads: number;
  materiais: { name: string; publicUrl: string }[];
  hasWhatsApp: boolean;
  hasResend: boolean;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-md bg-brand-primary px-6 py-4 text-base font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Disparando…' : '🚀 Disparar agora'}
    </button>
  );
}

export function BlastForm({
  leadCounts,
  totalLeads,
  materiais,
  hasWhatsApp,
  hasResend,
}: BlastFormProps) {
  const [state, action] = useFormState(createBlast, initial);
  const [channel, setChannel] = useState<string>('email');
  const [participationType, setParticipationType] = useState<string>('');
  const [message, setMessage] = useState('');

  const recipientCount =
    participationType === ''
      ? totalLeads
      : (leadCounts[participationType] ?? 0);

  const canSubmit = recipientCount > 0 && message.trim().length >= 5;
  const needsResend = channel === 'email' || channel === 'both';
  const needsWhatsApp = channel === 'whatsapp' || channel === 'both';
  const configWarning =
    (needsResend && !hasResend) || (needsWhatsApp && !hasWhatsApp);

  return (
    <form action={action} className="space-y-6">
      {/* Canal */}
      <div>
        <label className="mb-2 block text-sm font-bold text-brand-dark">
          Canal de envio
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CHANNEL_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                channel === opt.value
                  ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="channel"
                value={opt.value}
                checked={channel === opt.value}
                onChange={() => setChannel(opt.value)}
                className="mt-0.5 accent-brand-primary"
              />
              <div>
                <span className="text-lg">{opt.icon}</span>
                <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {configWarning && (
          <div className="mt-2 rounded-md bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {needsResend && !hasResend && (
              <p>⚠️ <strong>RESEND_API_KEY</strong> não configurado — e-mails não serão enviados.</p>
            )}
            {needsWhatsApp && !hasWhatsApp && (
              <p>⚠️ <strong>Webhook n8n</strong> não configurado — configure em Configurações.</p>
            )}
          </div>
        )}
      </div>

      {/* Destinatários */}
      <div>
        <label className="mb-2 block text-sm font-bold text-brand-dark">
          Destinatários
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map(({ value, label }) => {
            const count =
              value === ''
                ? totalLeads
                : (leadCounts[value] ?? 0);
            const isActive = participationType === value;
            return (
              <label
                key={value || 'all'}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-gray-300 text-gray-600 hover:border-brand-primary hover:text-brand-primary'
                }`}
              >
                <input
                  type="radio"
                  name="participation_type"
                  value={value}
                  checked={isActive}
                  onChange={() => setParticipationType(value)}
                  className="sr-only"
                />
                {label}{' '}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Mensagem */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label
            htmlFor="message"
            className="text-sm font-bold text-brand-dark"
          >
            Mensagem
          </label>
          <span className="text-xs text-gray-400">
            Variáveis:{' '}
            <code className="rounded bg-gray-100 px-1">{'{nome}'}</code>{' '}
            <code className="rounded bg-gray-100 px-1">{'{candidato}'}</code>
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          required
          minLength={5}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Olá, {nome}! 👋\nTemos uma novidade importante para você...`}
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <p className="mt-1 text-xs text-gray-400">
          {message.length} caracteres
        </p>
      </div>

      {/* Material opcional */}
      {materiais.length > 0 && (
        <div>
          <label
            htmlFor="material_url"
            className="mb-1 block text-sm font-bold text-brand-dark"
          >
            Material (opcional)
          </label>
          <select
            id="material_url"
            name="material_url"
            className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            <option value="">— Sem material —</option>
            {materiais.map((m) => (
              <option key={m.publicUrl} value={m.publicUrl}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            O link do material será incluído na mensagem.
          </p>
        </div>
      )}

      {/* Sumário */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-sm">
        <p className="font-semibold text-brand-dark">
          Resumo do disparo
        </p>
        <ul className="mt-2 space-y-1 text-gray-600">
          <li>
            Canal:{' '}
            <strong>
              {CHANNEL_OPTIONS.find((c) => c.value === channel)?.label}
            </strong>
          </li>
          <li>
            Destinatários: <strong>{recipientCount.toLocaleString('pt-BR')}</strong>{' '}
            {recipientCount === 1 ? 'lead' : 'leads'}
          </li>
          {recipientCount === 0 && (
            <li className="text-amber-700">
              ⚠️ Nenhum lead encontrado para este filtro.
            </li>
          )}
        </ul>
      </div>

      {state.error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}
