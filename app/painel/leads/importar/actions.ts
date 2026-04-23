'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireManagerSession } from '@/lib/painel/session';
import type { ParticipationType } from '@/lib/supabase/types';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: string[];
}

export interface ImportActionState {
  result: ImportResult | null;
  error: string | null;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const VALID_TYPES: ParticipationType[] = ['apoiador', 'colaborador', 'lideranca'];

// Mapeamento de nomes de coluna → campo interno
const NOME_ALIASES = ['nome', 'name', 'candidato', 'pessoa', 'contato'];
const WHATSAPP_ALIASES = ['whatsapp', 'telefone', 'celular', 'fone', 'phone', 'tel', 'numero', 'número'];
const EMAIL_ALIASES = ['email', 'e-mail', 'e_mail', 'correio'];
const TIPO_ALIASES = ['tipo', 'participacao', 'participação', 'tipo_participacao', 'tipo_participação', 'type'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function formatWhatsApp(raw: string): string {
  const digits = digitsOnly(raw);
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) 9${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return raw.trim();
}

function normalizeType(raw: string): ParticipationType {
  const s = raw.trim().toLowerCase();
  if (s.startsWith('col')) return 'colaborador';
  if (s.startsWith('lid') || s === 'liderança') return 'lideranca';
  return 'apoiador';
}

/** Parser de CSV robusto: lida com BOM, campos com aspas e newlines, separadores , ou ; */
function parseCSV(text: string): string[][] {
  // Remove BOM UTF-8
  const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
  // Normaliza CRLF → LF
  const normalized = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // Detecta separador: primeiro ; encontrado fora de aspas → ; ; caso contrário ,
  const sep = normalized.indexOf(';') !== -1 && normalized.indexOf(';') < (normalized.indexOf(',') === -1 ? Infinity : normalized.indexOf(',')) ? ';' : ',';

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  // Última linha (sem \n final)
  row.push(field);
  if (row.some((c) => c.trim())) rows.push(row);

  return rows;
}

/** Encontra o índice da coluna dado uma lista de aliases possíveis */
function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  return normalized.findIndex((h) => aliases.some((a) => h === a.replace(/[^a-z0-9]/g, '')));
}

/** Busca todas as planilhas já existentes (digits) em batch para deduplicação */
async function fetchExistingDigits(campaignId: string): Promise<Set<string>> {
  const admin = supabaseAdmin();
  const pageSize = 1000;
  let from = 0;
  const set = new Set<string>();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await admin
      .from('leads')
      .select('whatsapp')
      .eq('campaign_id', campaignId)
      .range(from, from + pageSize - 1);

    if (!data || data.length === 0) break;
    for (const r of data) set.add(digitsOnly(r.whatsapp ?? '').slice(-8));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return set;
}

// ── Core: converte CSV → array de leads válidos ───────────────────────────────

interface ParsedLead {
  name: string;
  whatsapp: string;
  whatsappDigits: string;
  email: string | null;
  participation_type: ParticipationType;
}

function csvToLeads(
  rows: string[][],
): { leads: ParsedLead[]; errors: string[] } {
  if (rows.length < 2) return { leads: [], errors: ['Planilha sem linhas de dados.'] };

  const headers = rows[0].map((h) => h.trim());
  const nomeIdx = findColumn(headers, NOME_ALIASES);
  const waIdx = findColumn(headers, WHATSAPP_ALIASES);
  const emailIdx = findColumn(headers, EMAIL_ALIASES);
  const tipoIdx = findColumn(headers, TIPO_ALIASES);

  const errors: string[] = [];

  if (nomeIdx === -1) errors.push('Coluna "nome" não encontrada. Cabeçalhos reconhecidos: nome, name, contato.');
  if (waIdx === -1) errors.push('Coluna "whatsapp" não encontrada. Cabeçalhos reconhecidos: whatsapp, telefone, celular.');
  if (errors.length) return { leads: [], errors };

  const leads: ParsedLead[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 1;

    const rawNome = row[nomeIdx]?.trim() ?? '';
    const rawWA = row[waIdx]?.trim() ?? '';
    const rawEmail = emailIdx !== -1 ? row[emailIdx]?.trim() ?? '' : '';
    const rawTipo = tipoIdx !== -1 ? row[tipoIdx]?.trim() ?? '' : '';

    if (!rawNome && !rawWA) continue; // linha vazia

    if (!rawNome || rawNome.length < 2) {
      errors.push(`Linha ${lineNum}: nome inválido ("${rawNome}").`);
      continue;
    }

    const digits = digitsOnly(rawWA);
    if (digits.length < 10) {
      errors.push(`Linha ${lineNum}: WhatsApp inválido ("${rawWA}").`);
      continue;
    }

    const participation_type: ParticipationType =
      rawTipo && VALID_TYPES.includes(rawTipo.toLowerCase() as ParticipationType)
        ? (rawTipo.toLowerCase() as ParticipationType)
        : rawTipo
        ? normalizeType(rawTipo)
        : 'apoiador';

    leads.push({
      name: rawNome,
      whatsapp: formatWhatsApp(rawWA),
      whatsappDigits: digits.slice(-8),
      email: rawEmail && rawEmail.includes('@') ? rawEmail : null,
      participation_type,
    });
  }

  return { leads, errors };
}

// ── Action: importar via URL do Google Sheets ─────────────────────────────────

export async function importFromGoogleSheets(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const { campaign } = await requireManagerSession();

  const rawUrl = (formData.get('sheets_url') as string | null)?.trim() ?? '';
  if (!rawUrl) {
    return { result: null, error: 'URL da planilha obrigatória.' };
  }

  // Extrai o ID e monta URL de export CSV
  // Formatos aceitos:
  //   https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0
  //   https://docs.google.com/spreadsheets/d/{ID}/pub...
  const match = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    return {
      result: null,
      error: 'URL inválida. Cole o link completo da planilha do Google Sheets.',
    };
  }

  const sheetId = match[1];
  // Pega o gid (aba) se especificado
  const gidMatch = rawUrl.match(/[#?&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

  let csvText: string;
  try {
    const res = await fetch(csvUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'Divulgacam/1.0' },
    });
    if (!res.ok) {
      return {
        result: null,
        error: `Não foi possível acessar a planilha (HTTP ${res.status}). Verifique se ela está compartilhada como "Qualquer pessoa com o link".`,
      };
    }
    csvText = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { result: null, error: `Erro ao baixar planilha: ${msg}` };
  }

  return processCSV(csvText, campaign.id);
}

// ── Action: importar via upload de arquivo CSV ────────────────────────────────

export async function importFromCSV(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const { campaign } = await requireManagerSession();

  const file = formData.get('csv_file') as File | null;
  if (!file || file.size === 0) {
    return { result: null, error: 'Selecione um arquivo CSV.' };
  }

  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    return { result: null, error: 'Apenas arquivos .csv são aceitos.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { result: null, error: 'Arquivo muito grande. Limite: 5 MB.' };
  }

  const csvText = await file.text();
  return processCSV(csvText, campaign.id);
}

// ── Núcleo de processamento ───────────────────────────────────────────────────

async function processCSV(csvText: string, campaignId: string): Promise<ImportActionState> {
  const rows = parseCSV(csvText);
  const { leads, errors } = csvToLeads(rows);

  if (leads.length === 0 && errors.length > 0) {
    return { result: null, error: errors.join(' ') };
  }

  // Deduplicação contra leads já existentes
  const existingDigits = await fetchExistingDigits(campaignId);

  const toInsert = leads.filter((l) => !existingDigits.has(l.whatsappDigits));
  const duplicateCount = leads.length - toInsert.length;

  const result: ImportResult = {
    total: rows.length > 1 ? rows.length - 1 : 0, // exclui cabeçalho
    imported: 0,
    duplicates: duplicateCount,
    errors: errors.length,
    errorDetails: errors,
  };

  if (toInsert.length === 0) {
    return { result, error: null };
  }

  // Insere em lotes de 200
  const BATCH = 200;
  let insertedCount = 0;

  const admin = supabaseAdmin();
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH).map((l) => ({
      campaign_id: campaignId,
      name: l.name,
      whatsapp: l.whatsapp,
      email: l.email,
      participation_type: l.participation_type,
    }));

    const { error: insertError } = await admin
      .from('leads')
      .insert(batch as never);

    if (insertError) {
      result.errors += batch.length;
      result.errorDetails.push(`Erro no lote ${Math.floor(i / BATCH) + 1}: ${insertError.message}`);
    } else {
      insertedCount += batch.length;
    }
  }

  result.imported = insertedCount;

  revalidatePath('/painel/leads');
  revalidatePath('/painel');

  return { result, error: null };
}
