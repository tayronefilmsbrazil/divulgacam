/**
 * Aplica a máscara (XX) 9XXXX-XXXX conforme o usuário digita.
 * Aceita qualquer input e retorna string parcialmente mascarada.
 */
export function maskWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Remove tudo que não for dígito. Útil para enviar ao n8n/Evolution. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
