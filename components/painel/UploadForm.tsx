'use client';

import { useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { uploadMaterial, type MaterialActionState } from '@/app/painel/materiais/actions';

const initial: MaterialActionState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Enviando…' : '↑ Enviar arquivo'}
    </button>
  );
}

export function UploadForm() {
  const [state, action] = useFormState(uploadMaterial, initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o input de arquivo após upload bem-sucedido
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/60 px-5 py-4 sm:flex-row sm:items-center"
    >
      <div className="flex-1 space-y-1.5">
        <input
          ref={inputRef}
          type="file"
          name="file"
          required
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.mp4,.mov,.mp3"
          className="block w-full text-sm text-gray-600
            file:mr-3 file:cursor-pointer file:rounded-md file:border-0
            file:bg-brand-dark file:px-3 file:py-1.5
            file:text-xs file:font-semibold file:text-white
            hover:file:bg-brand-dark/90"
        />
        <p className="text-xs text-gray-400">
          JPG · PNG · GIF · WEBP · PDF · MP4 · MP3 &nbsp;|&nbsp; Máx. 50 MB
        </p>
        {state.error && (
          <p className="text-xs font-medium text-red-600">{state.error}</p>
        )}
        {state.success && (
          <p className="text-xs font-medium text-green-600">
            ✓ Arquivo enviado com sucesso.
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
