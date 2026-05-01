'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  uploadMaterial,
  type MaterialActionState,
} from '@/app/painel/materiais/actions';

const initial: MaterialActionState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Enviando...' : 'Enviar arquivo'}
    </button>
  );
}

export function UploadForm() {
  const [state, action] = useFormState(uploadMaterial, initial);

  return (
    <form
      action={action}
      className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <p className="mb-3 text-sm font-semibold text-brand-dark">
        Enviar novo material
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          required
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4,video/quicktime,audio/mpeg,audio/mp3"
          className="flex-1 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-primary hover:file:bg-brand-primary/20"
        />
        <SubmitButton />
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Formatos aceitos: JPG, PNG, GIF, WEBP, PDF, MP4, MOV, MP3 · Máx. 50 MB
      </p>

      {state.error && (
        <p className="mt-3 rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-3 rounded-md bg-green-50 px-4 py-2.5 text-sm text-green-700">
          Arquivo enviado com sucesso!
        </p>
      )}
    </form>
  );
}
