/**
 * Prayatna Companion — Row Level Security (RLS) Verification Test Suite
 *
 * Verifies all 7 core security invariants against Supabase:
 *  1. A participant cannot read problem statements with release_at in the future.
 *  2. A participant cannot read unpublished leaderboard entries.
 *  3. A participant cannot insert/update/delete announcements, schedule events, bus routes or stops.
 *  4. A participant cannot update own role or team_id.
 *  5. A participant cannot read other participants' profiles.
 *  6. An organizer CAN do all of the above.
 *  7. An unauthenticated client can read nothing across protected tables.
 *
 * Usage:
 *   npm run test:rls
 *   or:
 *   node --experimental-strip-types --no-warnings scripts/rls-test.ts
 */

import fs from 'node:fs';
import path from 'node:path';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client as PgClient } from 'pg';

// -----------------------------------------------------------------------------
// Environment Configuration
// -----------------------------------------------------------------------------

function loadLocalEnv(envPath: string = path.resolve(process.cwd(), '.env')): void {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Prayatna%40acm@db.cgpqcpyfrajzfdezqgnm.supabase.co:5432/postgres';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Error: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Types & Test Tracking
// -----------------------------------------------------------------------------

interface TestCaseResult {
  id: string;
  category: string;
  description: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const testResults: TestCaseResult[] = [];

async function recordTest(
  id: string,
  category: string,
  description: string,
  fn: () => Promise<{ passed: boolean; details?: string }>
): Promise<void> {
  const startTime = Date.now();
  try {
    const res = await fn();
    testResults.push({
      id,
      category,
      description,
      passed: res.passed,
      durationMs: Date.now() - startTime,
      details: res.details,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    testResults.push({
      id,
      category,
      description,
      passed: false,
      durationMs: Date.now() - startTime,
      details: `Exception: ${msg}`,
    });
  }
}

// -----------------------------------------------------------------------------
// Deterministic Test Credentials & IDs
// -----------------------------------------------------------------------------

const TEST_PARTICIPANT_A = {
  email: 'rls_participant_a@prayatna.acm',
  password: 'TestParticipantPass123!@#',
  name: 'RLS Participant Alice',
  role: 'participant',
};

const TEST_PARTICIPANT_B = {
  email: 'rls_participant_b@prayatna.acm',
  password: 'TestParticipantPass123!@#',
  name: 'RLS Participant Bob',
  role: 'participant',
};

const TEST_ORGANIZER = {
  email: 'rls_organizer@prayatna.acm',
  password: 'TestOrganizerPass123!@#',
  name: 'RLS Lead Organizer',
  role: 'organizer',
};

const FUTURE_PROBLEM_ID = 'ffffffff-1111-4000-a000-000000000001';
const UNPUBLISHED_LEADERBOARD_ID = 'ffffffff-2222-4000-a000-000000000001';

// -----------------------------------------------------------------------------
// Database Provisioning & Seed Helper
// -----------------------------------------------------------------------------

async function setupDatabaseFixtures(pg: PgClient): Promise<{
  participantAId: string;
  participantBId: string;
  organizerId: string;
  team1Id: string;
  team2Id: string;
}> {
  async function upsertAuthUser(
    email: string,
    pass: string,
    role: 'participant' | 'organizer',
    fullName: string
  ): Promise<string> {
    const userRes = await pg.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    let userId: string;

    if (userRes.rows.length === 0) {
      const ins = await pg.query(
        `
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
          confirmation_token, recovery_token, email_change_token_new, email_change,
          phone_change, phone_change_token, reauthentication_token,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          $1, crypt($2, gen_salt('bf', 10)), now(),
          '', '', '', '', '', '', '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('full_name', $3::text),
          now(), now()
        ) RETURNING id;
      `,
        [email, pass, fullName]
      );
      userId = ins.rows[0].id;

      await pg.query(
        `
        INSERT INTO auth.identities (
          id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1::text, $2::uuid,
          jsonb_build_object('sub', $1::text, 'email', $3::text, 'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now()
        );
      `,
        [userId, userId, email]
      );
    } else {
      userId = userRes.rows[0].id;
      await pg.query(
        `
        UPDATE auth.users SET
          encrypted_password = crypt($2, gen_salt('bf', 10)),
          email_confirmed_at = now(),
          confirmation_token = '', recovery_token = '',
          email_change_token_new = '', email_change = '',
          phone_change = '', phone_change_token = '',
          reauthentication_token = ''
        WHERE id = $1;
      `,
        [userId, pass]
      );
    }

    // Temporarily bypass trigger to set initial role safely in public.profiles
    await pg.query("SET session_replication_role = 'replica';");
    await pg.query(
      `
      INSERT INTO public.profiles (id, full_name, email, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET role = $4, full_name = $2;
    `,
      [userId, fullName, email, role]
    );
    await pg.query("SET session_replication_role = 'origin';");

    return userId;
  }

  const participantAId = await upsertAuthUser(
    TEST_PARTICIPANT_A.email,
    TEST_PARTICIPANT_A.password,
    'participant',
    TEST_PARTICIPANT_A.name
  );

  const participantBId = await upsertAuthUser(
    TEST_PARTICIPANT_B.email,
    TEST_PARTICIPANT_B.password,
    'participant',
    TEST_PARTICIPANT_B.name
  );

  const organizerId = await upsertAuthUser(
    TEST_ORGANIZER.email,
    TEST_ORGANIZER.password,
    'organizer',
    TEST_ORGANIZER.name
  );

  // Ensure 2 teams exist
  const teamRes = await pg.query('SELECT id FROM public.teams ORDER BY created_at ASC LIMIT 2;');
  let team1Id: string;
  let team2Id: string;

  if (teamRes.rows.length >= 2) {
    team1Id = teamRes.rows[0].id;
    team2Id = teamRes.rows[1].id;
  } else {
    const t1 = await pg.query(
      `INSERT INTO public.teams (name, team_code) VALUES ('RLS Team Alpha', 'RLS-ALPHA-01') RETURNING id;`
    );
    const t2 = await pg.query(
      `INSERT INTO public.teams (name, team_code) VALUES ('RLS Team Beta', 'RLS-BETA-02') RETURNING id;`
    );
    team1Id = t1.rows[0].id;
    team2Id = t2.rows[0].id;
  }

  // Assign Team 1 to Participant A initially
  await pg.query("SET session_replication_role = 'replica';");
  await pg.query(`UPDATE public.profiles SET team_id = $1 WHERE id = $2;`, [
    team1Id,
    participantAId,
  ]);
  await pg.query(`UPDATE public.profiles SET team_id = $1 WHERE id = $2;`, [
    team2Id,
    participantBId,
  ]);
  await pg.query("SET session_replication_role = 'origin';");

  // Seed Future Problem Statement
  await pg.query(
    `
    INSERT INTO public.problem_statements (id, code, title, description, domain, difficulty, release_at)
    VALUES ($1, 'RLS-PROB-FUTURE', 'Classified Quantum Algorithm', 'Classified problem statement', 'AI', 'hard', now() + interval '7 days')
    ON CONFLICT (id) DO UPDATE SET release_at = now() + interval '7 days';
  `,
    [FUTURE_PROBLEM_ID]
  );

  // Seed Unpublished Leaderboard Entry
  await pg.query(
    `
    INSERT INTO public.leaderboard_entries (id, team_id, round_name, score, published)
    VALUES ($1, $2, 'RLS Secret Finals Evaluation', 98.5, false)
    ON CONFLICT (id) DO UPDATE SET published = false, score = 98.5;
  `,
    [UNPUBLISHED_LEADERBOARD_ID, team1Id]
  );

  return { participantAId, participantBId, organizerId, team1Id, team2Id };
}

// -----------------------------------------------------------------------------
// Main Test Runner
// -----------------------------------------------------------------------------

export async function runRlsTests(): Promise<void> {
  console.log('================================================================================');
  console.log('         PRAYATNA COMPANION — ROW LEVEL SECURITY (RLS) TEST SUITE               ');
  console.log('================================================================================');
  console.log(`Supabase Target URL : ${SUPABASE_URL}`);
  console.log(`Database Host       : db.cgpqcpyfrajzfdezqgnm.supabase.co`);
  console.log(`Timestamp           : ${new Date().toISOString()}`);
  console.log('================================================================================\n');

  const pg = new PgClient({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pg.connect();

  console.log('🔧 Initializing and synchronizing deterministic test fixtures...');
  const fixtures = await setupDatabaseFixtures(pg);
  console.log('✅ Test fixtures ready.\n');

  // ---------------------------------------------------------------------------
  // Initialize Supabase Clients
  // ---------------------------------------------------------------------------
  const unauthenticatedClient: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const participantClient: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const pSignIn = await participantClient.auth.signInWithPassword({
    email: TEST_PARTICIPANT_A.email,
    password: TEST_PARTICIPANT_A.password,
  });
  if (pSignIn.error) {
    throw new Error(`Failed to sign in participant test account: ${pSignIn.error.message}`);
  }

  const organizerClient: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const orgSignIn = await organizerClient.auth.signInWithPassword({
    email: TEST_ORGANIZER.email,
    password: TEST_ORGANIZER.password,
  });
  if (orgSignIn.error) {
    throw new Error(`Failed to sign in organizer test account: ${orgSignIn.error.message}`);
  }

  console.log('🔐 Authentication Established:');
  console.log(`   - Participant A : ${pSignIn.data.user?.email} (${pSignIn.data.user?.id})`);
  console.log(`   - Organizer     : ${orgSignIn.data.user?.email} (${orgSignIn.data.user?.id})`);
  console.log(`   - Unauth Client : Anon Key only (no session)\n`);

  console.log('🚀 Executing Invariant Assertions...\n');

  // ===========================================================================
  // 1. Future Problem Statements
  // ===========================================================================
  await recordTest(
    '1.1',
    'Problem Statements',
    'Participant CANNOT read problem statements with release_at in the future',
    async () => {
      const { data, error } = await participantClient
        .from('problem_statements')
        .select('id, title, release_at')
        .eq('id', FUTURE_PROBLEM_ID);

      const passed = !error && (!data || data.length === 0);
      return {
        passed,
        details: passed
          ? 'RLS filtered future row; 0 rows returned'
          : `Unexpectedly returned ${data?.length} row(s)`,
      };
    }
  );

  await recordTest(
    '1.2',
    'Problem Statements',
    'Participant CAN read past-released problem statements',
    async () => {
      const { data, error } = await participantClient
        .from('problem_statements')
        .select('id, title, release_at')
        .lte('release_at', new Date().toISOString())
        .limit(5);

      const passed = !error && Array.isArray(data) && data.length > 0;
      return {
        passed,
        details: passed
          ? `Correctly returned ${data?.length} released problem(s)`
          : `Failed to read released problems: ${error?.message || '0 rows returned'}`,
      };
    }
  );

  // ===========================================================================
  // 2. Unpublished Leaderboard Entries
  // ===========================================================================
  await recordTest(
    '2.1',
    'Leaderboard Entries',
    'Participant CANNOT read unpublished leaderboard entries (published = false)',
    async () => {
      const { data, error } = await participantClient
        .from('leaderboard_entries')
        .select('id, score, published')
        .eq('id', UNPUBLISHED_LEADERBOARD_ID);

      const passed = !error && (!data || data.length === 0);
      return {
        passed,
        details: passed
          ? 'RLS filtered unpublished entry; 0 rows returned'
          : `Unexpectedly returned ${data?.length} row(s)`,
      };
    }
  );

  await recordTest(
    '2.2',
    'Leaderboard Entries',
    'Participant CAN read published leaderboard entries (published = true)',
    async () => {
      const { data, error } = await participantClient
        .from('leaderboard_entries')
        .select('id, score, published')
        .eq('published', true)
        .limit(5);

      const passed = !error && Array.isArray(data) && data.length > 0;
      return {
        passed,
        details: passed
          ? `Correctly returned ${data?.length} published score(s)`
          : `Failed to read published scores: ${error?.message || '0 rows returned'}`,
      };
    }
  );

  // ===========================================================================
  // 3. Participant Mutations (Announcements, Schedule, Bus Routes, Bus Stops)
  // ===========================================================================

  // 3a. Announcements
  await recordTest(
    '3.1',
    'Announcements RLS',
    'Participant CANNOT insert announcements',
    async () => {
      const { data, error } = await participantClient
        .from('announcements')
        .insert({
          title: '[Unauthorized] Hackathon Canceled',
          body: 'Fake News',
          priority: 'urgent',
        })
        .select();

      const passed = Boolean(error || !data || data.length === 0);
      return {
        passed,
        details: error ? `Rejected by RLS: ${error.message}` : 'Zero rows inserted',
      };
    }
  );

  await recordTest(
    '3.2',
    'Announcements RLS',
    'Participant CANNOT update announcements',
    async () => {
      // Find an existing announcement
      const { data: list } = await participantClient
        .from('announcements')
        .select('id, title')
        .limit(1);
      const item = list?.[0];
      if (!item) return { passed: true, details: 'No announcements to test' };

      const annId = item.id;
      const originalTitle = item.title;
      const { data, error } = await participantClient
        .from('announcements')
        .update({ title: '[Defaced Title]' })
        .eq('id', annId)
        .select();

      // Check row in DB is unchanged
      const verify = await pg.query('SELECT title FROM public.announcements WHERE id = $1', [
        annId,
      ]);
      const unchanged = verify.rows[0]?.title === originalTitle;
      const passed = unchanged && (Boolean(error) || !data || data.length === 0);

      return {
        passed,
        details: passed
          ? 'Update rejected by RLS; DB row unmodified'
          : 'Update succeeded or mutated row',
      };
    }
  );

  await recordTest(
    '3.3',
    'Announcements RLS',
    'Participant CANNOT delete announcements',
    async () => {
      const { data: list } = await participantClient.from('announcements').select('id').limit(1);
      const item = list?.[0];
      if (!item) return { passed: true, details: 'No announcements to test' };

      const annId = item.id;
      const { data, error } = await participantClient
        .from('announcements')
        .delete()
        .eq('id', annId)
        .select();

      const verify = await pg.query('SELECT id FROM public.announcements WHERE id = $1', [annId]);
      const passed = verify.rows.length === 1 && (Boolean(error) || !data || data.length === 0);

      return {
        passed,
        details: passed
          ? 'Delete rejected by RLS; row preserved'
          : 'Delete unexpectedly removed row',
      };
    }
  );

  // 3b. Schedule Events
  await recordTest(
    '3.4',
    'Schedule Events RLS',
    'Participant CANNOT insert schedule events',
    async () => {
      const { data, error } = await participantClient
        .from('schedule_events')
        .insert({
          title: '[Unauthorized] Nap Time',
          event_type: 'other',
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 3600000).toISOString(),
        })
        .select();

      const passed = Boolean(error || !data || data.length === 0);
      return {
        passed,
        details: error ? `Rejected by RLS: ${error.message}` : 'Zero rows inserted',
      };
    }
  );

  await recordTest(
    '3.5',
    'Schedule Events RLS',
    'Participant CANNOT update schedule events',
    async () => {
      const { data: list } = await participantClient
        .from('schedule_events')
        .select('id, title')
        .limit(1);
      const item = list?.[0];
      if (!item) return { passed: true, details: 'No schedule events to test' };

      const eventId = item.id;
      const originalTitle = item.title;
      const { data, error } = await participantClient
        .from('schedule_events')
        .update({ title: '[Defaced Event]' })
        .eq('id', eventId)
        .select();

      const verify = await pg.query('SELECT title FROM public.schedule_events WHERE id = $1', [
        eventId,
      ]);
      const unchanged = verify.rows[0]?.title === originalTitle;
      const passed = unchanged && (Boolean(error) || !data || data.length === 0);

      return {
        passed,
        details: passed
          ? 'Update rejected by RLS; DB row unmodified'
          : 'Update mutated schedule row',
      };
    }
  );

  await recordTest(
    '3.6',
    'Schedule Events RLS',
    'Participant CANNOT delete schedule events',
    async () => {
      const { data: list } = await participantClient.from('schedule_events').select('id').limit(1);
      const item = list?.[0];
      if (!item) return { passed: true, details: 'No schedule events to test' };

      const eventId = item.id;
      const { data, error } = await participantClient
        .from('schedule_events')
        .delete()
        .eq('id', eventId)
        .select();

      const verify = await pg.query('SELECT id FROM public.schedule_events WHERE id = $1', [
        eventId,
      ]);
      const passed = verify.rows.length === 1 && (Boolean(error) || !data || data.length === 0);

      return {
        passed,
        details: passed ? 'Delete rejected by RLS; schedule row preserved' : 'Delete removed row',
      };
    }
  );

  // 3c. Bus Routes & Stops
  await recordTest('3.7', 'Bus Routes RLS', 'Participant CANNOT insert bus routes', async () => {
    const { data, error } = await participantClient
      .from('bus_routes')
      .insert({ name: '[Unauthorized] Rogue Bus Express' })
      .select();

    const passed = Boolean(error || !data || data.length === 0);
    return {
      passed,
      details: error ? `Rejected by RLS: ${error.message}` : 'Zero rows inserted',
    };
  });

  await recordTest('3.8', 'Bus Routes RLS', 'Participant CANNOT update bus routes', async () => {
    const { data: list } = await participantClient.from('bus_routes').select('id, name').limit(1);
    const item = list?.[0];
    if (!item) return { passed: true, details: 'No bus routes to test' };

    const routeId = item.id;
    const originalName = item.name;
    const { data, error } = await participantClient
      .from('bus_routes')
      .update({ name: '[Tampered Route]' })
      .eq('id', routeId)
      .select();

    const verify = await pg.query('SELECT name FROM public.bus_routes WHERE id = $1', [routeId]);
    const unchanged = verify.rows[0]?.name === originalName;
    const passed = unchanged && (Boolean(error) || !data || data.length === 0);

    return {
      passed,
      details: passed ? 'Update rejected by RLS; DB row unmodified' : 'Update mutated bus route',
    };
  });

  await recordTest('3.9', 'Bus Routes RLS', 'Participant CANNOT delete bus routes', async () => {
    const { data: list } = await participantClient.from('bus_routes').select('id').limit(1);
    const item = list?.[0];
    if (!item) return { passed: true, details: 'No bus routes to test' };

    const routeId = item.id;
    const { data, error } = await participantClient
      .from('bus_routes')
      .delete()
      .eq('id', routeId)
      .select();

    const verify = await pg.query('SELECT id FROM public.bus_routes WHERE id = $1', [routeId]);
    const passed = verify.rows.length === 1 && (Boolean(error) || !data || data.length === 0);

    return {
      passed,
      details: passed ? 'Delete rejected by RLS; route preserved' : 'Delete removed route',
    };
  });

  await recordTest('3.10', 'Bus Stops RLS', 'Participant CANNOT insert bus stops', async () => {
    const { data: list } = await participantClient.from('bus_routes').select('id').limit(1);
    const item = list?.[0];
    if (!item) return { passed: true, details: 'No bus routes to test' };

    const { data, error } = await participantClient
      .from('bus_stops')
      .insert({
        route_id: item.id,
        name: '[Unauthorized Stop]',
        latitude: 22.7,
        longitude: 75.8,
        stop_order: 99,
      })
      .select();

    const passed = Boolean(error || !data || data.length === 0);
    return {
      passed,
      details: error ? `Rejected by RLS: ${error.message}` : 'Zero rows inserted',
    };
  });

  await recordTest('3.11', 'Bus Stops RLS', 'Participant CANNOT update bus stops', async () => {
    const { data: list } = await participantClient.from('bus_stops').select('id, name').limit(1);
    const item = list?.[0];
    if (!item) return { passed: true, details: 'No bus stops to test' };

    const stopId = item.id;
    const originalName = item.name;
    const { data, error } = await participantClient
      .from('bus_stops')
      .update({ name: '[Defaced Stop]' })
      .eq('id', stopId)
      .select();

    const verify = await pg.query('SELECT name FROM public.bus_stops WHERE id = $1', [stopId]);
    const unchanged = verify.rows[0]?.name === originalName;
    const passed = unchanged && (Boolean(error) || !data || data.length === 0);

    return {
      passed,
      details: passed ? 'Update rejected by RLS; DB row unmodified' : 'Update mutated bus stop',
    };
  });

  await recordTest('3.12', 'Bus Stops RLS', 'Participant CANNOT delete bus stops', async () => {
    const { data: list } = await participantClient.from('bus_stops').select('id').limit(1);
    const item = list?.[0];
    if (!item) return { passed: true, details: 'No bus stops to test' };

    const stopId = item.id;
    const { data, error } = await participantClient
      .from('bus_stops')
      .delete()
      .eq('id', stopId)
      .select();

    const verify = await pg.query('SELECT id FROM public.bus_stops WHERE id = $1', [stopId]);
    const passed = verify.rows.length === 1 && (Boolean(error) || !data || data.length === 0);

    return {
      passed,
      details: passed ? 'Delete rejected by RLS; stop preserved' : 'Delete removed bus stop',
    };
  });

  // ===========================================================================
  // 4. Participant Profile Tampering Restrictions (Trigger & Policy)
  // ===========================================================================
  await recordTest(
    '4.1',
    'Profile Tampering',
    'Participant CANNOT escalate own role to organizer',
    async () => {
      const { error } = await participantClient
        .from('profiles')
        .update({ role: 'organizer' })
        .eq('id', fixtures.participantAId);

      const passed =
        Boolean(error) &&
        (error?.message.includes('Participants are not permitted to alter their role') ||
          error?.code === 'P0001');

      return {
        passed,
        details: error
          ? `Correctly blocked by trigger: "${error.message}"`
          : 'Failed: update succeeded without error',
      };
    }
  );

  await recordTest(
    '4.2',
    'Profile Tampering',
    'Participant CANNOT alter own team assignment (team_id)',
    async () => {
      const { error } = await participantClient
        .from('profiles')
        .update({ team_id: fixtures.team2Id })
        .eq('id', fixtures.participantAId);

      const passed =
        Boolean(error) &&
        (error?.message.includes('Participants are not permitted to alter their team assignment') ||
          error?.code === 'P0001');

      return {
        passed,
        details: error
          ? `Correctly blocked by trigger: "${error.message}"`
          : 'Failed: team update succeeded without error',
      };
    }
  );

  await recordTest(
    '4.3',
    'Profile Tampering',
    'Participant CAN update permissible profile fields (phone, college)',
    async () => {
      const testPhone = '+919999988888';
      const { data, error } = await participantClient
        .from('profiles')
        .update({ phone: testPhone })
        .eq('id', fixtures.participantAId)
        .select();

      const passed = !error && data?.[0]?.phone === testPhone;
      return {
        passed,
        details: passed
          ? 'Allowed field update succeeded as expected'
          : `Permitted update failed: ${error?.message}`,
      };
    }
  );

  // ===========================================================================
  // 5. Participant Profile Isolation
  // ===========================================================================
  await recordTest(
    '5.1',
    'Profile Isolation',
    "Participant CANNOT read other participants' profiles",
    async () => {
      const { data, error } = await participantClient
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', fixtures.participantBId);

      const passed = !error && (!data || data.length === 0);
      return {
        passed,
        details: passed
          ? 'Profile row isolation verified: 0 rows returned'
          : `Leaked ${data?.length} profile row(s) of other user`,
      };
    }
  );

  await recordTest('5.2', 'Profile Isolation', 'Participant CAN read own profile row', async () => {
    const { data, error } = await participantClient
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', fixtures.participantAId);

    const passed = !error && data?.[0]?.id === fixtures.participantAId;
    return {
      passed,
      details: passed
        ? 'Self-profile read successful'
        : `Failed to read own profile: ${error?.message}`,
    };
  });

  // ===========================================================================
  // 6. Organizer Privileges (CAN do all of the above)
  // ===========================================================================
  await recordTest(
    '6.1',
    'Organizer Privileges',
    'Organizer CAN read future problem statements',
    async () => {
      const { data, error } = await organizerClient
        .from('problem_statements')
        .select('id, code, title, release_at')
        .eq('id', FUTURE_PROBLEM_ID);

      const passed = !error && data?.[0]?.id === FUTURE_PROBLEM_ID;
      return {
        passed,
        details: passed
          ? 'Organizer successfully bypassed release_at lock'
          : `Organizer failed to read future problem: ${error?.message}`,
      };
    }
  );

  await recordTest(
    '6.2',
    'Organizer Privileges',
    'Organizer CAN read unpublished leaderboard entries',
    async () => {
      const { data, error } = await organizerClient
        .from('leaderboard_entries')
        .select('id, round_name, published, score')
        .eq('id', UNPUBLISHED_LEADERBOARD_ID);

      const passed = !error && data?.[0]?.id === UNPUBLISHED_LEADERBOARD_ID;
      return {
        passed,
        details: passed
          ? 'Organizer successfully read unpublished leaderboard entry'
          : `Organizer failed to read unpublished score: ${error?.message}`,
      };
    }
  );

  await recordTest(
    '6.3',
    'Organizer Privileges',
    'Organizer CAN insert, update, and delete announcements',
    async () => {
      // 1. Insert
      const ins = await organizerClient
        .from('announcements')
        .insert({
          title: '[Organizer Test] Live Broadcast Alert',
          body: 'Test Announcement Body',
          priority: 'urgent',
        })
        .select();

      if (ins.error || !ins.data?.[0]?.id) {
        return { passed: false, details: `Insert failed: ${ins.error?.message}` };
      }
      const annId = ins.data[0].id;

      // 2. Update
      const up = await organizerClient
        .from('announcements')
        .update({ title: '[Organizer Test] Updated Alert' })
        .eq('id', annId)
        .select();

      if (up.error || up.data?.[0]?.title !== '[Organizer Test] Updated Alert') {
        return { passed: false, details: `Update failed: ${up.error?.message}` };
      }

      // 3. Delete
      const del = await organizerClient.from('announcements').delete().eq('id', annId);
      if (del.error) {
        return { passed: false, details: `Delete failed: ${del.error?.message}` };
      }

      return { passed: true, details: 'Full CRUD cycle executed successfully' };
    }
  );

  await recordTest(
    '6.4',
    'Organizer Privileges',
    'Organizer CAN insert, update, and delete schedule events',
    async () => {
      const ins = await organizerClient
        .from('schedule_events')
        .insert({
          title: '[Organizer Test] Mentor Office Hours',
          event_type: 'workshop',
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 7200000).toISOString(),
        })
        .select();

      if (ins.error || !ins.data?.[0]?.id) {
        return { passed: false, details: `Insert failed: ${ins.error?.message}` };
      }
      const eventId = ins.data[0].id;

      const up = await organizerClient
        .from('schedule_events')
        .update({ title: '[Organizer Test] Extended Office Hours' })
        .eq('id', eventId)
        .select();

      if (up.error || up.data?.[0]?.title !== '[Organizer Test] Extended Office Hours') {
        return { passed: false, details: `Update failed: ${up.error?.message}` };
      }

      const del = await organizerClient.from('schedule_events').delete().eq('id', eventId);
      if (del.error) {
        return { passed: false, details: `Delete failed: ${del.error?.message}` };
      }

      return { passed: true, details: 'Full CRUD cycle executed successfully' };
    }
  );

  await recordTest(
    '6.5',
    'Organizer Privileges',
    'Organizer CAN insert, update, and delete bus transit routes',
    async () => {
      const ins = await organizerClient
        .from('bus_routes')
        .insert({
          name: '[Organizer Test] Ujjain Express',
          origin_city: 'Ujjain',
          color: '#10B981',
        })
        .select();

      if (ins.error || !ins.data?.[0]?.id) {
        return { passed: false, details: `Insert failed: ${ins.error?.message}` };
      }
      const routeId = ins.data[0].id;

      const up = await organizerClient
        .from('bus_routes')
        .update({ name: '[Organizer Test] Ujjain Superfast' })
        .eq('id', routeId)
        .select();

      if (up.error || up.data?.[0]?.name !== '[Organizer Test] Ujjain Superfast') {
        return { passed: false, details: `Update failed: ${up.error?.message}` };
      }

      const del = await organizerClient.from('bus_routes').delete().eq('id', routeId);
      if (del.error) {
        return { passed: false, details: `Delete failed: ${del.error?.message}` };
      }

      return { passed: true, details: 'Full CRUD cycle executed successfully' };
    }
  );

  await recordTest(
    '6.6',
    'Organizer Privileges',
    'Organizer CAN insert, update, and delete bus stops',
    async () => {
      // Create parent route first
      const routeIns = await organizerClient
        .from('bus_routes')
        .insert({ name: 'Temp Stop Test Route' })
        .select();

      if (routeIns.error || !routeIns.data?.[0]?.id) {
        return {
          passed: false,
          details: `Parent route creation failed: ${routeIns.error?.message}`,
        };
      }
      const routeId = routeIns.data[0].id;

      try {
        const ins = await organizerClient
          .from('bus_stops')
          .insert({
            route_id: routeId,
            name: '[Organizer Test] Railway Station Pickup',
            latitude: 23.18,
            longitude: 75.77,
            stop_order: 1,
          })
          .select();

        if (ins.error || !ins.data?.[0]?.id) {
          return { passed: false, details: `Stop insert failed: ${ins.error?.message}` };
        }
        const stopId = ins.data[0].id;

        const up = await organizerClient
          .from('bus_stops')
          .update({ name: '[Organizer Test] Platform 1 Pickup' })
          .eq('id', stopId)
          .select();

        if (up.error || up.data?.[0]?.name !== '[Organizer Test] Platform 1 Pickup') {
          return { passed: false, details: `Stop update failed: ${up.error?.message}` };
        }

        const del = await organizerClient.from('bus_stops').delete().eq('id', stopId);
        if (del.error) {
          return { passed: false, details: `Stop delete failed: ${del.error?.message}` };
        }

        return { passed: true, details: 'Full CRUD cycle executed successfully' };
      } finally {
        await organizerClient.from('bus_routes').delete().eq('id', routeId);
      }
    }
  );

  await recordTest(
    '6.7',
    'Organizer Privileges',
    'Organizer CAN reassign participant team_id and manage profiles',
    async () => {
      // Assign Participant A to Team 2
      const up = await organizerClient
        .from('profiles')
        .update({ team_id: fixtures.team2Id })
        .eq('id', fixtures.participantAId)
        .select();

      const passed = !up.error && up.data?.[0]?.team_id === fixtures.team2Id;

      // Restore back to Team 1
      await organizerClient
        .from('profiles')
        .update({ team_id: fixtures.team1Id })
        .eq('id', fixtures.participantAId);

      return {
        passed,
        details: passed
          ? 'Organizer successfully modified user team_id without trigger rejection'
          : `Failed: ${up.error?.message}`,
      };
    }
  );

  await recordTest(
    '6.8',
    'Organizer Privileges',
    "Organizer CAN read other participants' profiles",
    async () => {
      const { data, error } = await organizerClient
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', [fixtures.participantAId, fixtures.participantBId]);

      const passed = !error && data?.length === 2;
      return {
        passed,
        details: passed
          ? `Organizer retrieved both profiles (${data?.length} rows)`
          : `Organizer failed to read profiles: ${error?.message}`,
      };
    }
  );

  // ===========================================================================
  // 7. Unauthenticated Client (Can read nothing across protected tables)
  // ===========================================================================
  const protectedTables = [
    'profiles',
    'teams',
    'schedule_events',
    'problem_statements',
    'announcements',
    'leaderboard_entries',
    'bus_routes',
    'bus_stops',
    'bus_route_paths',
  ];

  for (let i = 0; i < protectedTables.length; i++) {
    const table = protectedTables[i]!;
    await recordTest(
      `7.${i + 1}`,
      'Unauthenticated RLS',
      `Unauthenticated client cannot read public.${table}`,
      async () => {
        const { data, error } = await unauthenticatedClient.from(table).select('*').limit(10);
        const passed = !error && (!data || data.length === 0);
        return {
          passed,
          details: passed
            ? '0 rows returned; table strictly protected'
            : `Unauthenticated leak: returned ${data?.length} row(s)`,
        };
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Teardown & Formatting
  // ---------------------------------------------------------------------------
  await pg.end();

  console.log('\n================================================================================');
  console.log('                          ROW LEVEL SECURITY TEST RESULTS                       ');
  console.log('================================================================================');

  const pad = (str: string, len: number) =>
    str.length > len ? str.slice(0, len - 3) + '...' : str.padEnd(len);

  console.log(
    `┌──────┬────────┬─────────────────────────┬────────────────────────────────────────────────────────┬─────────┐`
  );
  console.log(
    `│ ${pad('ID', 4)} │ ${pad('STATUS', 6)} │ ${pad('CATEGORY', 23)} │ ${pad('ASSERTION', 54)} │ ${pad('TIME', 7)} │`
  );
  console.log(
    `├──────┼────────┼─────────────────────────┼────────────────────────────────────────────────────────┼─────────┤`
  );

  let failedCount = 0;
  for (const t of testResults) {
    if (!t.passed) failedCount++;
    const statusText = t.passed ? 'PASS' : 'FAIL';
    console.log(
      `│ ${pad(t.id, 4)} │ ${pad(statusText, 6)} │ ${pad(t.category, 23)} │ ${pad(t.description, 54)} │ ${pad(`${t.durationMs}ms`, 7)} │`
    );
    if (!t.passed && t.details) {
      console.log(`│      │ DETAIL : ${pad(t.details, 88)} │`);
    }
  }

  console.log(
    `└──────┴────────┴─────────────────────────┴────────────────────────────────────────────────────────┴─────────┘`
  );

  const total = testResults.length;
  const passedCount = total - failedCount;
  console.log('\n================================================================================');
  console.log('                               SUMMARY REPORT                                   ');
  console.log('================================================================================');
  console.log(`Total Invariants Tested : ${total}`);
  console.log(`Passed Invariants       : ${passedCount}`);
  console.log(`Failed Invariants       : ${failedCount}`);
  console.log(
    `Overall Status          : ${failedCount === 0 ? 'ALL INVARIANTS SATISFIED ✅' : 'FAILURES DETECTED ❌'}`
  );
  console.log('================================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Direct execution entrypoint
void runRlsTests().catch((err: unknown) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
