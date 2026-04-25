'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(120),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
});

export type RegisterState = {
  error?: string;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const { name, email, password } = parsed.data;
  const admin = supabaseAdmin();

  // Create Supabase Auth user
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return { error: 'Este e-mail já está cadastrado. Tente fazer login.' };
    }
    return { error: 'Erro ao criar conta. Tente novamente.' };
  }

  if (!created.user) {
    return { error: 'Erro inesperado ao criar conta.' };
  }

  // Insert manager record with pending status
  const { error: insertError } = await admin.from('managers').insert({
    id: created.user.id,
    email,
    name,
    role: 'user',
    status: 'pending',
  });

  if (insertError) {
    // Rollback: delete the auth user
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: 'Erro ao registrar. Tente novamente.' };
  }

  redirect('/aguardando');
}
