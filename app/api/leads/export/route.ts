import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ParticipationType } from '@/lib/supabase/types';
import type { Database } from '@/lib/supabase/database.types';

type LeadExportRow = Pick<
  Database['public']['Tables']['leads']['Row'],
  'name' | 'whatsapp' | 'email' | 'participation_type' | 'created_at'
>;

const TYPE_LABEL: Record<ParticipationType, string> = {
  apoiador: 'Apoiador',
  colaborador: 'Colaborador',
  lideranca: 'Liderança',
};

/** Escapa campo para CSV (RFC 4180). */
function csv(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createSupabaseServerClient();

  // 1. Autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Busca campaign_id do gestor logado
  const { data: manager } = (await supabase
    .from('managers')
    .select('campaign_id')
    .eq('id', user.id)
    .maybeSingle()) as unknown as {
    data: { campaign_id: string } | null;
    error: unknown;
  };

  if (!manager) {
    return NextResponse.json(
      { error: 'Sem vínculo com campanha' },
      { status: 403 },
    );
  }

  // 3. Slug para nome do arquivo
  const { data: campaign } = (await supabase
    .from('campaigns')
    .select('slug')
    .eq('id', manager.campaign_id)
    .maybeSingle()) as unknown as {
    data: { slug: string } | null;
    error: unknown;
  };

  // 4. Todos os leads (RLS garante isolamento por campanha)
  const { data: leadsRaw, error: leadsErr } = await supabase
    .from('leads')
    .select('name, whatsapp, email, participation_type, created_at')
    .eq('campaign_id', manager.campaign_id)
    .order('created_at', { ascending: false });

  if (leadsErr) {
    return NextResponse.json({ error: leadsErr.message }, { status: 500 });
  }

  const leads = (leadsRaw ?? []) as LeadExportRow[];

  // 5. Monta CSV
  const header = 'Nome,WhatsApp,E-mail,Tipo de Participação,Data\n';
  const rows = leads
    .map((l) => {
      const data = new Date(l.created_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return [
        csv(l.name),
        csv(l.whatsapp),
        csv(l.email),
        csv(TYPE_LABEL[l.participation_type as ParticipationType]),
        csv(data),
      ].join(',');
    })
    .join('\n');

  const slug = campaign?.slug ?? 'leads';
  const date = new Date().toISOString().slice(0, 10);
  const filename = `leads-${slug}-${date}.csv`;

  // BOM para Excel reconhecer UTF-8 corretamente
  const BOM = '\uFEFF';

  return new NextResponse(BOM + header + rows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
