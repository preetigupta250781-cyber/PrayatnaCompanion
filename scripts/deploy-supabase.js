/**
 * Deploy Supabase Schema and Seed Script
 * Connects to PostgreSQL directly and executes migration & seed SQL.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Prayatna%40acm@db.cgpqcpyfrajzfdezqgnm.supabase.co:5432/postgres';

async function main() {
  console.log('🚀 Connecting to Supabase database (db.cgpqcpyfrajzfdezqgnm.supabase.co)...');
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to PostgreSQL!');

    // 1. Run Migration: 0001_init.sql
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0001_init.sql');
    console.log(`\n📦 Applying migration: ${migrationPath}...`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSql);
    console.log('✅ Migration 0001_init.sql applied successfully!');

    // 2. Run Seed: seed.sql
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    console.log(`\n🌱 Applying seed data: ${seedPath}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Seed data applied successfully!');

    // 3. Verify Tables & Counts
    console.log('\n🔍 Verifying deployed tables and row counts:');
    const tables = [
      'teams',
      'profiles',
      'schedule_events',
      'problem_statements',
      'announcements',
      'leaderboard_entries',
      'bus_routes',
      'bus_stops',
      'bus_route_paths',
    ];

    for (const table of tables) {
      const res = await client.query(`SELECT count(*)::int as count FROM public.${table};`);
      console.log(`   - public.${table.padEnd(22)}: ${res.rows[0].count} rows`);
    }

    // 4. Verify View & Functions
    console.log('\n🔍 Verifying Views and RPC functions:');
    const viewRes = await client.query(
      `SELECT count(*)::int as count FROM public.leaderboard_view;`
    );
    console.log(`   - public.leaderboard_view       : ${viewRes.rows[0].count} rows`);

    const serverNowRes = await client.query(`SELECT public.server_now() as now;`);
    console.log(`   - public.server_now()           : ${serverNowRes.rows[0].now}`);

    const nextReleaseRes = await client.query(
      `SELECT public.next_problem_release() as next_release;`
    );
    console.log(`   - public.next_problem_release() : ${nextReleaseRes.rows[0].next_release}`);

    console.log('\n🎉 Supabase database deployment completed successfully!');
  } catch (err) {
    console.error('\n❌ Deployment failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
