export type ParticipationType = 'apoiador' | 'colaborador' | 'lideranca';
export type BlastChannel     = 'whatsapp' | 'email' | 'both';
export type BlastStatus      = 'pending' | 'sending' | 'completed' | 'failed';
export type BlastLogStatus   = 'pending' | 'sent' | 'failed';

export interface Campaign {
  id: string;
  slug: string;
  name: string;
  candidate_name: string | null;
  logo_url: string | null;
  primary_color: string;
  n8n_webhook_url: string | null;
  whatsapp_instance: string | null;
  email_from: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  campaign_id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  participation_type: ParticipationType;
  created_at: string;
}

export interface Blast {
  id: string;
  campaign_id: string;
  manager_id: string;
  channel: BlastChannel;
  message: string;
  material_url: string | null;
  filters: Record<string, string> | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: BlastStatus;
  created_at: string;
  completed_at: string | null;
}

export interface BlastLog {
  id: string;
  blast_id: string;
  lead_id: string;
  channel: 'whatsapp' | 'email';
  status: BlastLogStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}
