'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireManagerSession } from '@/lib/painel/session';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export interface MaterialActionState {
  error: string | null;
  success: boolean;
}

// ── Upload ────────────────────────────────────────────────────

export async function uploadMaterial(
  _prev: MaterialActionState,
  formData: FormData,
): Promise<MaterialActionState> {
  const { campaign } = await requireManagerSession();

  const file = formData.get('file') as File | null;

  if (!file || file.size === 0) {
    return { error: 'Nenhum arquivo selecionado.', success: false };
  }
  if (file.size > MAX_SIZE) {
    return { error: 'Arquivo muito grande. Máximo permitido: 50 MB.', success: false };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      error: `Tipo não suportado: ${file.type || 'desconhecido'}. Use JPG, PNG, GIF, WEBP, PDF, MP4 ou MP3.`,
      success: false,
    };
  }

  // Sanitiza e cria caminho único no bucket
  const safeName = file.name
    .replace(/[^\w.\-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
  const path = `${campaign.id}/${Date.now()}-${safeName}`;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage
    .from('materiais')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: error.message, success: false };

  revalidatePath('/painel/materiais');
  return { error: null, success: true };
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteMaterial(path: string): Promise<void> {
  const { campaign } = await requireManagerSession();

  // Garante que o caminho pertence à campanha do gestor logado
  if (!path.startsWith(`${campaign.id}/`)) {
    throw new Error('Acesso negado.');
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage.from('materiais').remove([path]);

  if (error) throw new Error(error.message);

  revalidatePath('/painel/materiais');
}
