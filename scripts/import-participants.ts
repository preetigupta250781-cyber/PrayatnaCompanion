/**
 * Prayatna Companion — Participant Bulk Import Script
 *
 * Reads participants.csv (full_name,email,college,city,phone,team_name),
 * creates Supabase auth users via auth.admin.createUser (email_confirm: true),
 * upserts teams, creates/updates profiles, and exports credentials.csv (email,temp_password).
 *
 * Usage:
 *   npx ts-node scripts/import-participants.ts [--dry-run] [--file <path>]
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ParticipantRecord {
  readonly fullName: string;
  readonly email: string;
  readonly college: string;
  readonly city: string;
  readonly phone: string;
  readonly teamName: string;
}

export interface ImportResult {
  readonly email: string;
  readonly status: 'created' | 'existing_updated' | 'skipped' | 'error';
  readonly message?: string;
  readonly tempPassword?: string;
}

/**
 * Loads environment variables from local .env without requiring external dependencies
 */
export function loadLocalEnv(envPath: string = path.resolve(process.cwd(), '.env')): void {
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

/**
 * Generates an 18-character high-entropy temporary password
 */
export function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()_+-=';
  const allChars = upper + lower + digits + symbols;

  const randomBytes = crypto.randomBytes(16);
  let password = 'Pr@';

  for (let i = 0; i < 13; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      password += allChars[byte % allChars.length];
    }
  }

  return password + digits[crypto.randomInt(0, digits.length)];
}

/**
 * Generates a clean, unique team code from team name
 */
export function generateTeamCode(teamName: string): string {
  const cleanPrefix = teamName
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, 'X');
  const suffix = crypto.randomInt(1000, 9999);
  return `${cleanPrefix}-${suffix}`;
}

/**
 * Parses and validates CSV content
 */
export function parseParticipantsCsv(fileContent: string): {
  validRecords: ParticipantRecord[];
  invalidLines: { line: number; raw: string; error: string }[];
} {
  const validRecords: ParticipantRecord[] = [];
  const invalidLines: { line: number; raw: string; error: string }[] = [];
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { validRecords, invalidLines };
  }

  // Header detection: check if first line contains column headers
  const firstLine = lines[0] ?? '';
  const hasHeader =
    firstLine.toLowerCase().includes('email') || firstLine.toLowerCase().includes('name');
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  dataLines.forEach((rawLine, idx) => {
    const lineNumber = hasHeader ? idx + 2 : idx + 1;
    // CSV parser handling potential quotes
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());

    const fullName = cells[0]?.replace(/^"|"$/g, '').trim() ?? '';
    const email = cells[1]?.replace(/^"|"$/g, '').trim().toLowerCase() ?? '';
    const college = cells[2]?.replace(/^"|"$/g, '').trim() ?? '';
    const city = cells[3]?.replace(/^"|"$/g, '').trim() ?? '';
    const phone = cells[4]?.replace(/^"|"$/g, '').trim() ?? '';
    const teamName = cells[5]?.replace(/^"|"$/g, '').trim() ?? '';

    if (!fullName) {
      invalidLines.push({ line: lineNumber, raw: rawLine, error: 'Missing full_name' });
      return;
    }

    if (!email || !emailRegex.test(email)) {
      invalidLines.push({ line: lineNumber, raw: rawLine, error: `Invalid email: "${email}"` });
      return;
    }

    if (!teamName) {
      invalidLines.push({ line: lineNumber, raw: rawLine, error: 'Missing team_name' });
      return;
    }

    validRecords.push({
      fullName,
      email,
      college,
      city,
      phone,
      teamName,
    });
  });

  return { validRecords, invalidLines };
}

/**
 * Sleep helper for rate limit pacing
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upserts a team and returns its UUID
 */
async function getOrCreateTeam(
  supabase: SupabaseClient,
  teamName: string,
  cache: Map<string, string>
): Promise<string> {
  const cachedId = cache.get(teamName);
  if (cachedId) {
    return cachedId;
  }

  // 1. Look up existing team
  const { data: existing, error: selectErr } = await supabase
    .from('teams')
    .select('id')
    .eq('name', teamName)
    .maybeSingle();

  if (selectErr) {
    throw new Error(`Failed to query team "${teamName}": ${selectErr.message}`);
  }

  if (existing?.id) {
    cache.set(teamName, existing.id);
    return existing.id;
  }

  // 2. Create new team with unique code
  let created = false;
  let teamId = '';
  let attempts = 0;

  while (!created && attempts < 5) {
    attempts++;
    const teamCode = generateTeamCode(teamName);
    const { data: newTeam, error: insertErr } = await supabase
      .from('teams')
      .insert({ name: teamName, team_code: teamCode })
      .select('id')
      .single();

    if (!insertErr && newTeam) {
      teamId = newTeam.id;
      created = true;
    } else if (insertErr && insertErr.code === '23505') {
      // Unique collision on code or name; re-check if name was created concurrently
      const { data: concurrentTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('name', teamName)
        .maybeSingle();

      if (concurrentTeam?.id) {
        teamId = concurrentTeam.id;
        created = true;
      }
    } else if (insertErr) {
      throw new Error(`Failed to create team "${teamName}": ${insertErr.message}`);
    }
  }

  if (!teamId) {
    throw new Error(`Failed to provision team "${teamName}" after multiple attempts.`);
  }

  cache.set(teamName, teamId);
  return teamId;
}

/**
 * Main execution entry point
 */
export async function main(): Promise<void> {
  loadLocalEnv();

  const isDryRun = process.argv.includes('--dry-run');
  const fileArgIdx = process.argv.indexOf('--file');
  const inputFilePath =
    fileArgIdx !== -1 && process.argv[fileArgIdx + 1]
      ? path.resolve(process.cwd(), process.argv[fileArgIdx + 1] ?? '')
      : path.resolve(process.cwd(), 'participants.csv');

  console.log('===========================================================');
  console.log('   PRAYATNA COMPANION — PARTICIPANT BULK IMPORT UTILITY    ');
  console.log('===========================================================');
  console.log(`Execution Mode:     ${isDryRun ? 'DRY-RUN (No writes)' : 'LIVE EXECUTION'}`);
  console.log(`Input CSV Source:   ${inputFilePath}`);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`\n❌ Input CSV file not found at: ${inputFilePath}`);
    console.log('\nExpected CSV Format (participants.csv):');
    console.log('full_name,email,college,city,phone,team_name');
    console.log('Aarav Sharma,aarav@example.com,IIT Indore,Indore,+919876543210,Algorhythms\n');
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isDryRun) {
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('\n❌ Missing required Supabase credentials for LIVE mode:');
      if (!supabaseUrl) console.error('  - Missing SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL');
      if (!serviceRoleKey) console.error('  - Missing SUPABASE_SERVICE_ROLE_KEY in .env');
      console.log(
        '\n👉 Ensure your local .env includes SUPABASE_SERVICE_ROLE_KEY=ey... (never commit this key!).'
      );
      process.exit(1);
    }
  }

  const supabase =
    !isDryRun && supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : (null as unknown as SupabaseClient);

  const rawCsv = fs.readFileSync(inputFilePath, 'utf-8');
  const { validRecords, invalidLines } = parseParticipantsCsv(rawCsv);

  console.log(`Rows Extracted:     ${validRecords.length} valid, ${invalidLines.length} invalid\n`);

  if (invalidLines.length > 0) {
    console.warn('⚠️  Invalid Rows Flagged:');
    invalidLines.slice(0, 10).forEach((inv) => {
      console.warn(`  [Line ${inv.line}] ${inv.error} -> "${inv.raw}"`);
    });
    if (invalidLines.length > 10) {
      console.warn(`  ... and ${invalidLines.length - 10} more invalid rows.`);
    }
    console.log('');
  }

  if (validRecords.length === 0) {
    console.log('No valid participants found to process.');
    return;
  }

  // Deduplicate within the CSV by email (keeping first occurrence)
  const uniqueRecords: ParticipantRecord[] = [];
  const seenEmails = new Set<string>();
  let inCsvDuplicates = 0;

  for (const record of validRecords) {
    if (seenEmails.has(record.email)) {
      inCsvDuplicates++;
    } else {
      seenEmails.add(record.email);
      uniqueRecords.push(record);
    }
  }

  if (inCsvDuplicates > 0) {
    console.log(`ℹ️  Skipped ${inCsvDuplicates} duplicate email entries in CSV file.\n`);
  }

  const results: ImportResult[] = [];
  const credentialsOut: { email: string; tempPassword: string }[] = [];
  const teamCache = new Map<string, string>();

  // Process participants
  for (let i = 0; i < uniqueRecords.length; i++) {
    const record = uniqueRecords[i];
    if (!record) continue;

    const progress = `[${i + 1}/${uniqueRecords.length}]`;

    if (isDryRun) {
      console.log(
        `${progress} [DRY-RUN] Would process: ${record.email} (Team: ${record.teamName})`
      );
      results.push({
        email: record.email,
        status: 'created',
        message: 'Dry-run simulated creation',
      });
      continue;
    }

    try {
      // 1. Resolve / Upsert Team
      const teamId = await getOrCreateTeam(supabase, record.teamName, teamCache);

      // 2. Provision Auth User
      const tempPassword = generateStrongPassword();
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: record.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: record.fullName,
        },
      });

      let userId: string | null = null;
      let wasCreated = false;

      if (authError) {
        // If user already exists, retrieve ID from profiles table
        if (
          authError.message.includes('already registered') ||
          authError.message.includes('already exists')
        ) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', record.email)
            .maybeSingle();

          if (existingProfile?.id) {
            userId = existingProfile.id;
          } else {
            // Find in auth.users by email lookup
            const { data: listData } = await supabase.auth.admin.listUsers();
            const foundUser = listData?.users.find((u) => u.email === record.email);
            if (foundUser) {
              userId = foundUser.id;
            }
          }
        }

        if (!userId) {
          console.error(`${progress} ❌ Auth error for ${record.email}: ${authError.message}`);
          results.push({ email: record.email, status: 'error', message: authError.message });
          continue;
        }
      } else if (authData.user) {
        userId = authData.user.id;
        wasCreated = true;
      }

      if (!userId) {
        results.push({ email: record.email, status: 'error', message: 'Unknown user ID error' });
        continue;
      }

      // 3. Upsert Profile record
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: record.fullName,
        email: record.email,
        college: record.college || null,
        city: record.city || null,
        phone: record.phone || null,
        team_id: teamId,
        role: 'participant',
      });

      if (profileError) {
        console.error(`${progress} ❌ Profile error for ${record.email}: ${profileError.message}`);
        results.push({ email: record.email, status: 'error', message: profileError.message });
      } else if (wasCreated) {
        console.log(`${progress} ✅ Created: ${record.email} (Team: ${record.teamName})`);
        credentialsOut.push({ email: record.email, tempPassword });
        results.push({ email: record.email, status: 'created', tempPassword });
      } else {
        console.log(
          `${progress} 🔄 Updated existing profile: ${record.email} (Team: ${record.teamName})`
        );
        results.push({
          email: record.email,
          status: 'existing_updated',
          message: 'Existing user updated',
        });
      }

      // 4. Rate-limit pacing (100ms delay between administrative API calls)
      await sleep(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${progress} ❌ Unexpected exception for ${record.email}: ${msg}`);
      results.push({ email: record.email, status: 'error', message: msg });
    }
  }

  // 5. Write credentials.csv if any users were created
  if (!isDryRun && credentialsOut.length > 0) {
    const credentialsPath = path.resolve(process.cwd(), 'credentials.csv');
    const csvLines = ['email,temp_password'];
    credentialsOut.forEach((c) => csvLines.push(`${c.email},${c.tempPassword}`));
    fs.writeFileSync(credentialsPath, csvLines.join('\n') + '\n', 'utf-8');
    console.log(`\n🔑 Exported ${credentialsOut.length} credentials to: ${credentialsPath}`);
  }

  // 6. Summary Report
  const createdCount = results.filter((r) => r.status === 'created').length;
  const updatedCount = results.filter((r) => r.status === 'existing_updated').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  console.log('\n===========================================================');
  console.log('              IMPORT PROCESS SUMMARY                       ');
  console.log('===========================================================');
  console.log(`Total Records Parsed:   ${validRecords.length + invalidLines.length}`);
  console.log(`Valid Unique Records:   ${uniqueRecords.length}`);
  console.log(`Invalid / Malformed:    ${invalidLines.length}`);
  console.log(`Newly Created Users:    ${createdCount}`);
  console.log(`Existing Updated:       ${updatedCount}`);
  console.log(`Errors Encountered:     ${errorCount}`);
  console.log('===========================================================');

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

// Direct execution
void main().catch((err: unknown) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
