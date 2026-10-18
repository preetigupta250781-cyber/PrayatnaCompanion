-- =============================================================================
-- Migration: 0001_init.sql
-- Description: Initial schema definition for Prayatna Companion
-- Features: Teams, Profiles, Schedule Events, Problem Statements, Announcements,
--           Leaderboard, Bus Transit Routes, Functions, Triggers, Views, and RLS.
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid() support across PostgreSQL versions
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. ENUMS & EXTENSIONS
-- =============================================================================

-- Ensure event_type, priority, and role values are strictly validated via check constraints

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 Teams
-- -----------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  team_code text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.teams is 'Hackathon participating teams with unique join codes';

-- -----------------------------------------------------------------------------
-- 2.2 Profiles (Linked to auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  college text,
  city text,
  phone text,
  team_id uuid references public.teams(id) on delete set null,
  role text not null default 'participant' check (role in ('participant', 'organizer')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile records extending Supabase auth.users';

-- -----------------------------------------------------------------------------
-- 2.3 Schedule Events
-- -----------------------------------------------------------------------------
create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  event_type text not null check (
    event_type in ('session', 'workshop', 'jamming', 'judging', 'meal', 'ceremony', 'other')
  ),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint chk_schedule_events_time check (ends_at > starts_at)
);

comment on table public.schedule_events is 'Event schedule timeline with chronological check constraint';

-- -----------------------------------------------------------------------------
-- 2.4 Problem Statements
-- -----------------------------------------------------------------------------
create table if not exists public.problem_statements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  domain text,
  difficulty text,
  release_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.problem_statements is 'Hackathon tracks and problems released at designated times';

-- -----------------------------------------------------------------------------
-- 2.5 Announcements
-- -----------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  priority text not null default 'normal' check (
    priority in ('normal', 'important', 'urgent')
  ),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.announcements is 'Broadcast announcements and urgent event alerts';

-- -----------------------------------------------------------------------------
-- 2.6 Leaderboard Entries
-- -----------------------------------------------------------------------------
create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  round_name text not null,
  score numeric not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint uq_leaderboard_team_round unique (team_id, round_name)
);

comment on table public.leaderboard_entries is 'Per-round scoring entries with publish toggles';

-- -----------------------------------------------------------------------------
-- 2.7 Bus Transit Routes
-- -----------------------------------------------------------------------------
create table if not exists public.bus_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text,
  origin_city text,
  departs_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.bus_routes is 'Designated hackathon transit routes from regional pickup cities';

-- -----------------------------------------------------------------------------
-- 2.8 Bus Stops
-- -----------------------------------------------------------------------------
create table if not exists public.bus_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.bus_routes(id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  stop_order int not null,
  scheduled_time timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint chk_bus_stops_latitude check (latitude between -90 and 90),
  constraint chk_bus_stops_longitude check (longitude between -180 and 180),
  constraint uq_bus_stops_route_stop_order unique (route_id, stop_order)
);

comment on table public.bus_stops is 'Waypoints and pickup stops along each transit route';

-- -----------------------------------------------------------------------------
-- 2.9 Bus Route Paths (Coordinate polylines)
-- -----------------------------------------------------------------------------
create table if not exists public.bus_route_paths (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.bus_routes(id) on delete cascade,
  points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.bus_route_paths is 'Detailed JSON polyline coordinates [{lat, lng}] for map rendering';

-- =============================================================================
-- 3. FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 is_organizer() -> Checks if current authenticated user is an organizer
-- -----------------------------------------------------------------------------
create or replace function public.is_organizer()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select role = 'organizer'
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

comment on function public.is_organizer() is 'Determines if the active session user has the organizer role';

-- -----------------------------------------------------------------------------
-- 3.2 next_problem_release() -> Earliest future release_at timestamp (no content)
-- -----------------------------------------------------------------------------
create or replace function public.next_problem_release()
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select min(release_at)
  from public.problem_statements
  where release_at > now();
$$;

comment on function public.next_problem_release() is 'Returns countdown target for next locked problem statement without leaking problem data';

-- -----------------------------------------------------------------------------
-- 3.3 server_now() -> Synchronized server timestamp
-- -----------------------------------------------------------------------------
create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

comment on function public.server_now() is 'Provides authoritative server-side time to avoid client clock drift issues';

-- -----------------------------------------------------------------------------
-- 3.4 enforce_profile_update_restrictions() -> Trigger function for profiles
-- -----------------------------------------------------------------------------
create or replace function public.enforce_profile_update_restrictions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If updater is not an organizer, prevent tampering with role or team_id
  if not public.is_organizer() then
    if new.role is distinct from old.role then
      raise exception 'Participants are not permitted to alter their role.';
    end if;

    if new.team_id is distinct from old.team_id then
      raise exception 'Participants are not permitted to alter their team assignment directly.';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.enforce_profile_update_restrictions() is 'Restricts modification of role and team_id columns to organizers only';

-- -----------------------------------------------------------------------------
-- 3.5 handle_new_user() -> Trigger to bootstrap profile row on user registration
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    'participant'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Automatically provisions a participant profile row on auth.users sign-up';

-- -----------------------------------------------------------------------------
-- 3.6 set_updated_at() -> Utility trigger to auto-update timestamp
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- Enforce profile update restrictions
drop trigger if exists trg_profiles_enforce_update_restrictions on public.profiles;
create trigger trg_profiles_enforce_update_restrictions
  before update on public.profiles
  for each row
  execute function public.enforce_profile_update_restrictions();

-- Auto provision profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Auto update updated_at on leaderboard_entries
drop trigger if exists trg_leaderboard_entries_updated_at on public.leaderboard_entries;
create trigger trg_leaderboard_entries_updated_at
  before update on public.leaderboard_entries
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on every table
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.schedule_events enable row level security;
alter table public.problem_statements enable row level security;
alter table public.announcements enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.bus_routes enable row level security;
alter table public.bus_stops enable row level security;
alter table public.bus_route_paths enable row level security;

-- -----------------------------------------------------------------------------
-- 5.1 Profiles Policies
-- User can select/update own row; organizers can select/update all.
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or public.is_organizer()
  );

drop policy if exists "profiles_update_policy" on public.profiles;
create policy "profiles_update_policy"
  on public.profiles
  for update
  to authenticated
  using (
    auth.uid() = id
    or public.is_organizer()
  )
  with check (
    auth.uid() = id
    or public.is_organizer()
  );

drop policy if exists "profiles_insert_policy" on public.profiles;
create policy "profiles_insert_policy"
  on public.profiles
  for insert
  to authenticated
  with check (
    auth.uid() = id
    or public.is_organizer()
  );

-- -----------------------------------------------------------------------------
-- 5.2 Teams Policies
-- Authenticated select; organizers all.
-- -----------------------------------------------------------------------------
drop policy if exists "teams_select_policy" on public.teams;
create policy "teams_select_policy"
  on public.teams
  for select
  to authenticated
  using (true);

drop policy if exists "teams_organizer_all_policy" on public.teams;
create policy "teams_organizer_all_policy"
  on public.teams
  for all
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

-- -----------------------------------------------------------------------------
-- 5.3 Schedule Events Policies
-- Authenticated select; organizers insert/update/delete.
-- -----------------------------------------------------------------------------
drop policy if exists "schedule_events_select_policy" on public.schedule_events;
create policy "schedule_events_select_policy"
  on public.schedule_events
  for select
  to authenticated
  using (true);

drop policy if exists "schedule_events_organizer_insert_policy" on public.schedule_events;
create policy "schedule_events_organizer_insert_policy"
  on public.schedule_events
  for insert
  to authenticated
  with check (public.is_organizer());

drop policy if exists "schedule_events_organizer_update_policy" on public.schedule_events;
create policy "schedule_events_organizer_update_policy"
  on public.schedule_events
  for update
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

drop policy if exists "schedule_events_organizer_delete_policy" on public.schedule_events;
create policy "schedule_events_organizer_delete_policy"
  on public.schedule_events
  for delete
  to authenticated
  using (public.is_organizer());

-- -----------------------------------------------------------------------------
-- 5.4 Problem Statements Policies
-- Authenticated select ONLY WHERE release_at <= now(); organizers full access.
-- -----------------------------------------------------------------------------
drop policy if exists "problem_statements_select_policy" on public.problem_statements;
create policy "problem_statements_select_policy"
  on public.problem_statements
  for select
  to authenticated
  using (
    release_at <= now()
    or public.is_organizer()
  );

drop policy if exists "problem_statements_organizer_all_policy" on public.problem_statements;
create policy "problem_statements_organizer_all_policy"
  on public.problem_statements
  for all
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

-- -----------------------------------------------------------------------------
-- 5.5 Announcements Policies
-- Authenticated select; organizers insert/update/delete.
-- -----------------------------------------------------------------------------
drop policy if exists "announcements_select_policy" on public.announcements;
create policy "announcements_select_policy"
  on public.announcements
  for select
  to authenticated
  using (true);

drop policy if exists "announcements_organizer_insert_policy" on public.announcements;
create policy "announcements_organizer_insert_policy"
  on public.announcements
  for insert
  to authenticated
  with check (public.is_organizer());

drop policy if exists "announcements_organizer_update_policy" on public.announcements;
create policy "announcements_organizer_update_policy"
  on public.announcements
  for update
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

drop policy if exists "announcements_organizer_delete_policy" on public.announcements;
create policy "announcements_organizer_delete_policy"
  on public.announcements
  for delete
  to authenticated
  using (public.is_organizer());

-- -----------------------------------------------------------------------------
-- 5.6 Leaderboard Entries Policies
-- Authenticated select ONLY WHERE published = true; organizers full access.
-- -----------------------------------------------------------------------------
drop policy if exists "leaderboard_entries_select_policy" on public.leaderboard_entries;
create policy "leaderboard_entries_select_policy"
  on public.leaderboard_entries
  for select
  to authenticated
  using (
    published = true
    or public.is_organizer()
  );

drop policy if exists "leaderboard_entries_organizer_all_policy" on public.leaderboard_entries;
create policy "leaderboard_entries_organizer_all_policy"
  on public.leaderboard_entries
  for all
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

-- -----------------------------------------------------------------------------
-- 5.7 Bus Routes Policies
-- Authenticated select; organizers insert/update/delete.
-- -----------------------------------------------------------------------------
drop policy if exists "bus_routes_select_policy" on public.bus_routes;
create policy "bus_routes_select_policy"
  on public.bus_routes
  for select
  to authenticated
  using (true);

drop policy if exists "bus_routes_organizer_insert_policy" on public.bus_routes;
create policy "bus_routes_organizer_insert_policy"
  on public.bus_routes
  for insert
  to authenticated
  with check (public.is_organizer());

drop policy if exists "bus_routes_organizer_update_policy" on public.bus_routes;
create policy "bus_routes_organizer_update_policy"
  on public.bus_routes
  for update
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

drop policy if exists "bus_routes_organizer_delete_policy" on public.bus_routes;
create policy "bus_routes_organizer_delete_policy"
  on public.bus_routes
  for delete
  to authenticated
  using (public.is_organizer());

-- -----------------------------------------------------------------------------
-- 5.8 Bus Stops Policies
-- Authenticated select; organizers insert/update/delete.
-- -----------------------------------------------------------------------------
drop policy if exists "bus_stops_select_policy" on public.bus_stops;
create policy "bus_stops_select_policy"
  on public.bus_stops
  for select
  to authenticated
  using (true);

drop policy if exists "bus_stops_organizer_insert_policy" on public.bus_stops;
create policy "bus_stops_organizer_insert_policy"
  on public.bus_stops
  for insert
  to authenticated
  with check (public.is_organizer());

drop policy if exists "bus_stops_organizer_update_policy" on public.bus_stops;
create policy "bus_stops_organizer_update_policy"
  on public.bus_stops
  for update
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

drop policy if exists "bus_stops_organizer_delete_policy" on public.bus_stops;
create policy "bus_stops_organizer_delete_policy"
  on public.bus_stops
  for delete
  to authenticated
  using (public.is_organizer());

-- -----------------------------------------------------------------------------
-- 5.9 Bus Route Paths Policies
-- Authenticated select; organizers insert/update/delete.
-- -----------------------------------------------------------------------------
drop policy if exists "bus_route_paths_select_policy" on public.bus_route_paths;
create policy "bus_route_paths_select_policy"
  on public.bus_route_paths
  for select
  to authenticated
  using (true);

drop policy if exists "bus_route_paths_organizer_insert_policy" on public.bus_route_paths;
create policy "bus_route_paths_organizer_insert_policy"
  on public.bus_route_paths
  for insert
  to authenticated
  with check (public.is_organizer());

drop policy if exists "bus_route_paths_organizer_update_policy" on public.bus_route_paths;
create policy "bus_route_paths_organizer_update_policy"
  on public.bus_route_paths
  for update
  to authenticated
  using (public.is_organizer())
  with check (public.is_organizer());

drop policy if exists "bus_route_paths_organizer_delete_policy" on public.bus_route_paths;
create policy "bus_route_paths_organizer_delete_policy"
  on public.bus_route_paths
  for delete
  to authenticated
  using (public.is_organizer());

-- =============================================================================
-- 6. VIEWS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6.1 Leaderboard View (security_invoker = true)
-- Aggregates total score, dense rank, team metadata, and per-round score array.
-- Under security_invoker = true, participants only see published entries,
-- while organizers see both published and pending rounds.
-- -----------------------------------------------------------------------------
create or replace view public.leaderboard_view
with (security_invoker = true)
as
with team_scores as (
  select
    t.id as team_id,
    t.name as team_name,
    t.team_code,
    coalesce(sum(le.score), 0) as total_score,
    count(le.id) as published_rounds_count,
    max(le.updated_at) as last_score_updated_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', le.id,
          'round_name', le.round_name,
          'score', le.score,
          'published', le.published,
          'updated_at', le.updated_at
        ) order by le.round_name
      ) filter (where le.id is not null),
      '[]'::jsonb
    ) as rounds
  from public.teams t
  left join public.leaderboard_entries le
    on le.team_id = t.id
  group by t.id, t.name, t.team_code
)
select
  team_id,
  team_name,
  team_code,
  total_score,
  published_rounds_count,
  last_score_updated_at,
  rounds,
  dense_rank() over (
    order by total_score desc, team_name asc
  ) as rank
from team_scores;

comment on view public.leaderboard_view is 'Dynamic team leaderboard with per-team total score, dense rank, and round breakdown (RLS-enforced via security_invoker)';

-- =============================================================================
-- 7. REALTIME PUBLICATION
-- =============================================================================

-- Enable replica identity full so real-time updates and deletes receive entire row payload
alter table public.schedule_events replica identity full;
alter table public.problem_statements replica identity full;
alter table public.announcements replica identity full;
alter table public.leaderboard_entries replica identity full;
alter table public.bus_routes replica identity full;
alter table public.bus_stops replica identity full;

-- Idempotently add tables to supabase_realtime publication
do $$
declare
  tbl text;
  tables text[] := array[
    'schedule_events',
    'problem_statements',
    'announcements',
    'leaderboard_entries',
    'bus_routes',
    'bus_stops'
  ];
begin
  -- Create supabase_realtime publication if it does not already exist
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  -- Add tables if not already registered in the publication
  foreach tbl in array tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', tbl);
    end if;
  end loop;
end;
$$;

-- =============================================================================
-- 8. INDEXES
-- =============================================================================

-- Schedule events: Chronological lookup and filtering
create index if not exists idx_schedule_events_starts_at
  on public.schedule_events (starts_at);

-- Announcements: Reverse chronological feed
create index if not exists idx_announcements_created_at_desc
  on public.announcements (created_at desc);

-- Problem statements: Release window checks
create index if not exists idx_problem_statements_release_at
  on public.problem_statements (release_at);

-- Bus stops: Ordered route sequence traversal
create index if not exists idx_bus_stops_route_stop_order
  on public.bus_stops (route_id, stop_order);

-- Foreign key & relational performance indexes
create index if not exists idx_profiles_team_id
  on public.profiles (team_id);

create index if not exists idx_leaderboard_entries_team_id
  on public.leaderboard_entries (team_id);

create index if not exists idx_bus_route_paths_route_id
  on public.bus_route_paths (route_id);
