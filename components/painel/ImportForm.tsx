'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  importFromGoogleSheets,
  importFromCSV,
  type ImportActionState,
} from '@/app/painel/leads/importar/actions';

const initial: ImportActionState = { result: null, error: null };

type Mode = 'sheets' | 'csv';

export function ImportForm() {
  const [mode, setMode] = useState<Mode>('sheets');
  const [sheetsState, sheetsAction] = useFormState(importFromGoogleSheets, initial);
  const [csvState, csvAction] = useFormState(importFromCSV, initial);

  const state = mode === 'sheets' ? sheetsState : csvState;

  return (
    <div className="space-y-6">
      {/* Seleção de modo */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setMode('sheets')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
            mode === 'sheets'
              ? 'bg-white text-brand-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔗 URL do Google Sheets
        </button>
        <button
          type="button"
          onClick={() => setMode('csv')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
            mode === 'csv'
              ? 'bg-white text-brand-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📄 Upload de CSV
        </button>
      </div>

      {/* Formulário Google Sheets */}
      {mode === 'sheets' && (
        <form action={sheetsAction} className="space-y-4">
          <div>
            <label
              htmlFor="sheets_url"
              className="mb-1 block text-sm font-semibold text-brand-dark"
            >
              Link da planilha
            </label>
            <input
              id="sheets_url"
              name="sheets_url"
              type="url"
              required
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              A planilha precisa estar compartilhada como{' '}
              <strong>"Qualquer pessoa com o link pode ver"</strong>. Cole o link
              copiado do botão Compartilhar.
            </p>
          </div>

          <SheetColumnsHint />

          <SubmitButton label="Importar planilha" />
        </form>
      )}

      {/* Formulário CSV */}
      {mode === 'csv' && (
        <form action={csvAction} className="space-y-4">
          <div>
            <label
              htmlFor="csv_file"
              className="mb-1 block text-sm font-semibold text-brand-dark"
            >
              Arquivo CSV
            </label>
            <input
              id="csv_file"
              name="csv_file"
              type="file"
              accept=".csv,text/csv"
              required
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-xs file:font-bold file:text-white file:uppercase file:tracking-wide file:cursor-pointer"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Máx. 5 MB. Use , ou ; como separador. Codificação UTF-8.
            </p>
          </div>

          <SheetColumnsHint />

          <SubmitButton label="Importar CSV" />
        </form>
      )}

      {/* Resultado */}
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Erro na importação</p>
          <p className="mt-0.5">{state.error}</p>
        </div>
      )}

      {state.result && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-4 text-sm">
          <p className="font-bold text-green-800 text-base">
            ✓ Importação concluída
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Total na planilha" value={state.result.total} />
            <Stat label="Importados" value={state.result.imported} color="text-green-700" />
            <Stat label="Duplicados" value={state.result.duplicates} color="text-amber-700" />
            <Stat label="Erros" value={state.result.errors} color="text-red-700" />
          </dl>

          {state.result.errorDetails.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Ver detalhes dos erros ({state.result.errorDetails.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {state.result.errorDetails.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">
                    • {e}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {state.result.imported > 0 && (
            <p className="mt-3">
              <a
                href="/painel/leads"
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                Ver leads importados →
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? 'Processando…' : label}
    </button>
  );
}

function Stat({
  label,
  value,
  color = 'text-gray-800',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-md bg-white border border-gray-200 px-3 py-2 text-center">
      <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SheetColumnsHint() {
  return (
    <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
      <p className="font-semibold mb-1">Colunas reconhecidas automaticamente:</p>
      <ul className="space-y-0.5">
        <li>
          <strong>nome</strong> (obrigatório) — ou{' '}
          <code className="rounded bg-blue-100 px-1">name</code>,{' '}
          <code className="rounded bg-blue-100 px-1">contato</code>
        </li>
        <li>
          <strong>whatsapp</strong> (obrigatório) — ou{' '}
          <code className="rounded bg-blue-100 px-1">telefone</code>,{' '}
          <code className="rounded bg-blue-100 px-1">celular</code>
        </li>
        <li>
          <strong>email</strong> (opcional)
        </li>
        <li>
          <strong>tipo</strong> (opcional) —{' '}
          <code className="rounded bg-blue-100 px-1">apoiador</code>{' '}
          <code className="rounded bg-blue-100 px-1">colaborador</code>{' '}
          <code className="rounded bg-blue-100 px-1">lideranca</code>
        </li>
      </ul>
    </div>
  );
}
