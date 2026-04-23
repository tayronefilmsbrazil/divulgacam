import type { ParticipationType, BlastChannel, BlastStatus, BlastLogStatus } from './types';

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          slug: string;
          name: string;
          candidate_name: string | null;
          logo_url: string | null;
          primary_color: string;
          n8n_webhook_url: string | null;
          whatsapp_instance: string | null;
          email_from: string | null;
          smtp_config: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          candidate_name?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          n8n_webhook_url?: string | null;
          whatsapp_instance?: string | null;
          email_from?: string | null;
          smtp_config?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          campaign_id: string;
          name: string;
          whatsapp: string;
          email: string | null;
          participation_type: ParticipationType;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          name: string;
          whatsapp: string;
          email?: string | null;
          participation_type: ParticipationType;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'leads_campaign_id_fkey';
            columns: ['campaign_id'];
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          }
        ];
      };
      managers: {
        Row: {
          id: string;
          campaign_id: string;
          name: string | null;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          campaign_id: string;
          name?: string | null;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['managers']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'managers_campaign_id_fkey';
            columns: ['campaign_id'];
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'managers_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      blasts: {
        Row: {
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
        };
        Insert: {
          id?: string;
          campaign_id: string;
          manager_id: string;
          channel: BlastChannel;
          message: string;
          material_url?: string | null;
          filters?: Record<string, string> | null;
          total_recipients: number;
          sent_count?: number;
          failed_count?: number;
          status?: BlastStatus;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['blasts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'blasts_campaign_id_fkey';
            columns: ['campaign_id'];
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          }
        ];
      };
      blast_logs: {
        Row: {
          id: string;
          blast_id: string;
          lead_id: string;
          channel: 'whatsapp' | 'email';
          status: BlastLogStatus;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          blast_id: string;
          lead_id: string;
          channel: 'whatsapp' | 'email';
          status?: BlastLogStatus;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blast_logs']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'blast_logs_blast_id_fkey';
            columns: ['blast_id'];
            referencedRelation: 'blasts';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
