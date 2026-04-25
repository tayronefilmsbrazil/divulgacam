'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireGestorSession } from '@/lib/painel/session';
import type { ManagerRole, ManagerStatus } from '@/lib/supabase/types';

const MASTER_EMAIL = 'tayrone@tayronefilms.com.br';

export async function approveUser(userId: string): Promise<{ error?: string }> {
  const { manager } = await requireGestorSession();

  const admin = supabaseAdmin();
  const { error } = await admin
    .from('managers')
    .update({ status: 'approved' as ManagerStatus } as never)
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath('/painel/usuarios');
  return {};
}

export async function rejectUser(userId: string): Promise<{ error?: string }> {
  await requireGestorSession();

  const admin = supabaseAdmin();
  const { error } = await admin
    .from('managers')
    .update({ status: 'rejected' as ManagerStatus } as never)
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath('/painel/usuarios');
  return {};
}

export async function assignCampaign(
  userId: string,
  campaignId: string,
): Promise<{ error?: string }> {
  await requireGestorSession();

  const admin = supabaseAdmin();
  const { error } = await admin
    .from('managers')
    .update({ campaign_id: campaignId } as never)
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath('/painel/usuarios');
  return {};
}

export async function toggleGestorRole(
  userId: string,
  makeGestor: boolean,
): Promise<{ error?: string }> {
  const { manager } = await requireGestorSession();

  // Only master can change roles
  if (manager.role !== 'master') {
    return { error: 'Apenas o administrador master pode alterar papéis.' };
  }

  // Cannot change master's own role
  const admin = supabaseAdmin();
  const { data: target } = await admin
    .from('managers')
    .select('email, role')
    .eq('id', userId)
    .maybeSingle();

  if (!target) return { error: 'Usuário não encontrado.' };
  if (target.email === MASTER_EMAIL) {
    return { error: 'Não é possível alterar o papel do administrador master.' };
  }

  const newRole: ManagerRole = makeGestor ? 'gestor' : 'user';
  const { error } = await admin
    .from('managers')
    .update({ role: newRole } as never)
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath('/painel/usuarios');
  return {};
}

export async function resetUserPassword(
  userId: string,
): Promise<{ error?: string; newPassword?: string }> {
  await requireGestorSession();

  const admin = supabaseAdmin();

  // Generate random password
  const { randomBytes } = await import('node:crypto');
  const newPassword = randomBytes(9).toString('base64url');

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { error: error.message };

  return { newPassword };
}
