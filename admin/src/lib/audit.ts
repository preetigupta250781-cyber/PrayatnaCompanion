import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type AuditAction =
  | 'CREATE_SCHEDULE'
  | 'UPDATE_SCHEDULE'
  | 'DELETE_SCHEDULE'
  | 'CREATE_PROBLEM'
  | 'UPDATE_PROBLEM'
  | 'DELETE_PROBLEM'
  | 'CREATE_ANNOUNCEMENT'
  | 'DELETE_ANNOUNCEMENT'
  | 'UPDATE_SCORE'
  | 'BULK_UPDATE_SCORES'
  | 'PUBLISH_ROUND'
  | 'UNPUBLISH_ROUND'
  | 'CREATE_ROUTE'
  | 'UPDATE_ROUTE'
  | 'DELETE_ROUTE'
  | 'CREATE_BUS_STOP'
  | 'UPDATE_BUS_STOP'
  | 'DELETE_BUS_STOP'
  | 'UPDATE_STOPS'
  | 'SAVE_BUS_PATH'
  | 'IMPORT_PARTICIPANTS'
  | 'CREATE_TEAM'
  | 'UPDATE_TEAM'
  | 'DELETE_TEAM'
  | string;

export interface LogAuditParams {
  supabase?: SupabaseClient;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Inserts an immutable audit record for an organizer action into public.audit_logs.
 * Governed by RLS (only organizers can insert).
 */
export async function logAuditEvent({
  supabase,
  action,
  resourceType,
  resourceId,
  metadata = {},
}: LogAuditParams): Promise<void> {
  try {
    const client = supabase || createClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      console.warn('Cannot log audit event: No authenticated user session.');
      return;
    }

    const { error } = await client.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action,
      resource_type: resourceType,
      resource_id: resourceId ? String(resourceId) : null,
      metadata,
    });

    if (error) {
      console.error('Failed to insert audit log record:', error.message);
    }
  } catch (err) {
    console.error('Unexpected error in logAuditEvent:', err);
  }
}
