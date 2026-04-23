'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ParticipationToggle } from '@/components/ParticipationToggle';
import { leadSchema } from '@/lib/validation/lead';
import type { ParticipationType } from '@/lib/supabase/types';
import { maskWhatsapp } from '@/lib/utils/whatsapp-mask';

interface LeadFormProps {
  campaignId: string;
  campaignSlug: string;
  primaryColor: string;
}

interface FieldErrors {
  nome?: string;
  whatsapp?: string;
  email?: string;
  tipo_participacao?: string;
  form?: string;
}

export function LeadForm({
  campaignId,
  campaignSlug,
  primaryColor,
}: LeadFormProps) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [tipoParticipacao, setTipoParticipacao] =
    useState<ParticipationType | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = leadSchema.safeParse({
      nome: nome.trim(),
      whatsapp,
      email,
      tipo_participacao: tipoParticipacao ?? undefined,
      campanha_id: campaignId,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrors({
          form:
            body?.error ||
            'Não foi possível enviar agora. Tente novamente em instantes.',
        });
        setSubmitting(false);
        return;
      }

      router.push(`/${campaignSlug}/confirmacao`);
    } catch {
      setErrors({
        form: 'Erro de conexão. Verifique sua internet e tente de novo.',
      });
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-xl bg-white p-6 shadow-lg sm:p-8"
    >
      {errors.form && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-dark">
          Como você quer participar?
        </label>
        <ParticipationToggle
          value={tipoParticipacao}
          onChange={setTipoParticipacao}
          primaryColor={primaryColor}
        />
        {errors.tipo_participacao && (
          <p className="mt-2 text-sm text-red-600">{errors.tipo_participacao}</p>
        )}
      </div>

      <Field
        label="Nome completo"
        error={errors.nome}
        required
      >
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Maria Silva"
          autoComplete="name"
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </Field>

      <Field label="WhatsApp" error={errors.whatsapp} required>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
          placeholder="(82) 9XXXX-XXXX"
          inputMode="numeric"
          autoComplete="tel-national"
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </Field>

      <Field label="E-mail (opcional)" error={errors.email}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        style={{ backgroundColor: primaryColor }}
        className="flex w-full items-center justify-center rounded-md px-6 py-4 text-base font-bold uppercase tracking-wide text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Spinner />
            Enviando…
          </>
        ) : (
          'Quero fazer parte'
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Seus dados são utilizados apenas para fins desta campanha.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-brand-dark">
        {label} {required && <span className="text-brand-primary">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="mr-2 h-5 w-5 animate-spin text-white"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
