/**
 * Prayatna Companion — Create Organizer Account Script
 *
 * Provisions an administrator/organizer account via Supabase auth.admin
 * and assigns role = 'organizer' in public.profiles.
 *
 * Usage:
 *   npx ts-node scripts/create-organizer.ts --email <email> [--name <name>] [--password <password>]
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

/**
 * Loads environment variables from local .env
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
 * Generates an 18-character temporary password if none is provided
 */
function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()_+-=';
  const allChars = upper + lower + digits + symbols;

  const randomBytes = crypto.randomBytes(16);
  let password = 'Org@';

  for (let i = 0; i < 13; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      password += allChars[byte % allChars.length];
    }
  }

  return password + digits[crypto.randomInt(0, digits.length)];
}

function parseFlag(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1]?.trim();
  }
  return undefined;
}

export async function main(): Promise<void> {
  loadLocalEnv();

  const email = parseFlag('--email') || process.env.ORGANIZER_EMAIL || 'organizer@prayatna.org';

  const fullName = parseFlag('--name') || process.env.ORGANIZER_NAME || 'Lead Organizer';

  const providedPassword = parseFlag('--password') || process.env.ORGANIZER_PASSWORD;

  const password = providedPassword || generateStrongPassword();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('===========================================================');
  console.log('      PRAYATNA COMPANION — CREATE ORGANIZER ACCOUNT        ');
  console.log('===========================================================');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('\n❌ Missing required Supabase credentials:');
    if (!supabaseUrl) console.error('  - Missing SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) console.error('  - Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log(
      '\n👉 Add SUPABASE_SERVICE_ROLE_KEY to your local .env to manage organizer accounts.'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`Target Email:       ${email}`);
  console.log(`Full Name:          ${fullName}`);
  console.log(`Role:               organizer\n`);

  try {
    let userId: string | null = null;
    let created = false;

    // 1. Attempt to create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already exists')
      ) {
        console.log(`ℹ️  User ${email} already exists in auth. Finding user ID...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users.find((u) => u.email === email);
        if (existing) {
          userId = existing.id;
          if (providedPassword) {
            // Update password if explicitly provided
            await supabase.auth.admin.updateUserById(userId, { password: providedPassword });
            console.log('🔑 Updated user password to provided password.');
          }
        }
      } else {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }
    } else if (authData.user) {
      userId = authData.user.id;
      created = true;
    }

    if (!userId) {
      throw new Error(`Unable to resolve user ID for ${email}`);
    }

    // 2. Upsert profile with role = 'organizer'
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      email,
      role: 'organizer',
    });

    if (profileError) {
      throw new Error(`Failed to update profile role: ${profileError.message}`);
    }

    console.log('===========================================================');
    console.log('✅ ORGANIZER ACCOUNT CONFIGURED SUCCESSFULLY');
    console.log('===========================================================');
    console.log(`User ID:            ${userId}`);
    console.log(`Email:              ${email}`);
    console.log(`Role:               organizer (Full administrative permissions)`);
    if (created || providedPassword) {
      console.log(`Password:           ${password}`);
    } else {
      console.log('Password:           (Existing password unchanged)');
    }
    console.log('===========================================================');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Error configuring organizer account: ${msg}`);
    process.exit(1);
  }
}

// Direct execution
void main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
