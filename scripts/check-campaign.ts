import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, n8n_webhook_url, whatsapp_instance, email_from')
    .eq('id', '5a1127ba-714c-4cd4-9ecc-e6e8502d9f13')
    .single();

  if (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }

  console.log('Campanha:', data?.name);
  console.log('n8n_webhook_url:', data?.n8n_webhook_url ?? '(null — não configurado)');
  console.log('whatsapp_instance:', data?.whatsapp_instance ?? '(null)');
  console.log('email_from:', data?.email_from ?? '(null)');
}

main();
