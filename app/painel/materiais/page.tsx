import type { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireManagerSession } from '@/lib/painel/session';
import { UploadForm } from '@/components/painel/UploadForm';
import { DeleteMaterialForm } from '@/components/painel/DeleteMaterialForm';

export const metadata: Metadata = {
  title: 'Materiais — Divulgacam',
  robots: { index: false, follow: false },
};

// Força renderização dinâmica (cookies de sessão)
export const dynamic = 'force-dynamic';

function formatSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileEmoji(mimeType: string | undefined): string {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  return '📄';
}

/** Remove prefixo de timestamp gerado no upload (ex: 1714000000000-). */
function displayName(filename: string): string {
  return filename.replace(/^\d{10,13}-/, '');
}

export default async function MateriaisPage() {
  const { campaign } = await requireManagerSession();
  const supabase = createSupabaseServerClient();

  const { data: files, error } = await supabase.storage
    .from('materiais')
    .list(campaign.id, {
      sortBy: { column: 'created_at', order: 'desc' },
      limit: 200,
    });

  const fileList = (files ?? []).filter(
    (f) => f.name !== '.emptyFolderPlaceholder',
  );

  return (
    <main className="px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-brand-dark">Materiais</h1>
        <p className="mt-1 text-sm text-gray-600">
          Arquivos da campanha{' '}
          <strong>{campaign.name}</strong> — disponíveis para download pelos
          apoiadores.
        </p>
      </header>

      {/* Upload */}
      <UploadForm />

      {/* Listagem */}
      {error && (
        <p className="mt-6 text-sm text-red-600">
          Erro ao carregar materiais: {error.message}
        </p>
      )}

      {!error && fileList.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-14 text-center">
          <p className="text-2xl">📂</p>
          <p className="mt-2 text-sm text-gray-400">
            Nenhum material enviado ainda. Clique em &ldquo;Enviar arquivo&rdquo; para adicionar.
          </p>
        </div>
      )}

      {fileList.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {fileList.map((file) => {
            const path = `${campaign.id}/${file.name}`;
            const {
              data: { publicUrl },
            } = supabase.storage.from('materiais').getPublicUrl(path);

            const meta = file.metadata as
              | { mimetype?: string; size?: number }
              | null;
            const mime = meta?.mimetype;
            const isImage = mime?.startsWith('image/');

            return (
              <div
                key={file.id ?? file.name}
                className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Preview */}
                <div className="flex h-28 items-center justify-center overflow-hidden bg-gray-50">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicUrl}
                      alt={displayName(file.name)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">{fileEmoji(mime)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-3">
                  <p
                    className="truncate text-xs font-medium text-gray-900"
                    title={displayName(file.name)}
                  >
                    {displayName(file.name)}
                  </p>
                  {meta?.size !== undefined && (
                    <p className="text-[11px] text-gray-400">
                      {formatSize(meta.size)}
                    </p>
                  )}

                  {/* Ações */}
                  <div className="mt-2 flex gap-1.5">
                    <a
                      href={publicUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded bg-gray-100 px-2 py-1 text-center text-[11px] font-semibold text-gray-600 transition hover:bg-brand-primary hover:text-white"
                    >
                      ↓ Download
                    </a>

                    <DeleteMaterialForm
                      path={path}
                      displayName={displayName(file.name)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
