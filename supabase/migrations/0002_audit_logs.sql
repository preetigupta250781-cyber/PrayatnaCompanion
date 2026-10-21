-- =============================================================================
-- Migration: 0002_audit_logs.sql
-- Description: Audit log table for organizer actions in the Admin Dashboard
-- =============================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null, -- e.g. 'CREATE_SCHEDULE', 'UPDATE_PROBLEM', 'PUBLISH_LEADERBOARD', 'IMPORT_PARTICIPANTS'
  resource_type text not null, -- 'schedule_events', 'problem_statements', 'announcements', 'leaderboard', 'bus_routes', 'participants'
  resource_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Audit trail of administrative actions executed by organizers';

-- Enable Row Level Security
alter table public.audit_logs enable row level security;

-- Only authenticated organizers can view audit logs
create policy "Organizers can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_organizer());

-- Organizers can insert audit log records
create policy "Organizers can insert audit logs"
  on public.audit_logs for insert
  to authenticated
  with check (public.is_organizer());

-- Non-organizers and unauthenticated users can access nothing
