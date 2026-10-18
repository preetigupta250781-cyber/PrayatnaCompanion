# Prayatna Companion — Administrator & Organizer Guide

This document outlines the administrative command-line utilities used for provisioning accounts, bulk importing participants, seeding hackathon data, and managing access control in **Prayatna Companion**.

---

## 1. Prerequisites & Environment Configuration

Administrative scripts require **Elevated Database Privileges** using the Supabase **Service Role Key**.

> [!CAUTION]
> **CRITICAL SECURITY NOTICE:**
> The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row-Level Security (RLS) policies.
>
> - **NEVER** expose the Service Role Key in client application code or prefix it with `EXPO_PUBLIC_`.
> - **NEVER** commit the Service Role Key or `credentials.csv` to version control. Both `.env` and `*.csv` are strictly ignored by `.gitignore`.

### Required Environment Variables

Ensure your local root `.env` file contains:

```bash
# Public API endpoint
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Standard Client Anon Key
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Admin Service Role Key (Used ONLY by scripts/ on administrator workstations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 2. Participant Bulk Import (`scripts/import-participants.ts`)

The participant import utility automates user provisioning, team association, and temporary credential generation for hundreds of hackathon attendees in seconds.

### Input File Format (`participants.csv`)

Place a CSV file named `participants.csv` in the project root (or supply a custom path with `--file <path>`).

```csv
full_name,email,college,city,phone,team_name
Aarav Sharma,aarav@algorhythms.com,IIT Indore,Indore,+919876543210,Algorhythms
Ananya Patel,ananya@algorhythms.com,SGSITS Indore,Indore,+919876543211,Algorhythms
Rohan Mehta,rohan@bytecoders.org,MANIT Bhopal,Bhopal,+919876543212,ByteCoders
Priya Singh,priya@bytecoders.org,LNCT Bhopal,Bhopal,+919876543213,ByteCoders
Vikram Joshi,vikram@neuralknights.io,DAVV Indore,Indore,+919876543214,NeuralKnights
```

#### Field Specifications:

- `full_name`: Required non-empty string.
- `email`: Required valid email address (format checked via regex).
- `college`: Optional college/institution name.
- `city`: Optional origin city.
- `phone`: Optional contact number.
- `team_name`: Required team name.

---

### Running the Importer

#### 1. Dry-Run Verification (Recommended First Step)

Simulates CSV parsing, input validation, email deduplication, and team assignment **without creating users or modifying the database**:

```bash
npm run import:participants -- --dry-run
```

To test a custom CSV path:

```bash
npm run import:participants -- --dry-run --file ./path/to/custom-participants.csv
```

#### 2. Live Execution

Executes the live import against your Supabase project:

```bash
npm run import:participants
```

### What Happens During Live Execution:

1. **Validation & Deduplication:** Parses CSV rows, filters out invalid rows (with descriptive line numbers), and skips duplicate emails within the file.
2. **Team Resolution & Upserting:** Queries `public.teams` by `team_name`. If absent, automatically provisions the team with an auto-generated unique team code (e.g., `ALGO-8492`).
3. **Auth User Provisioning:** Generates an 18-character high-entropy temporary password (`Pr@...`) and invokes `supabase.auth.admin.createUser()` with `email_confirm: true`.
4. **Profile Linking:** Upserts `public.profiles` with `role = 'participant'`, attaching personal metadata and the foreign key `team_id`.
5. **Rate-Limit Pacing:** Introduces controlled sleep intervals (100ms) between write operations to prevent HTTP 429 rate limit errors from Supabase Auth.
6. **Credential Export:** Writes all generated passwords to `credentials.csv` in the project root:
   ```csv
   email,temp_password
   aarav@algorhythms.com,Pr@xK9#mQ2$vL89
   ananya@algorhythms.com,Pr@tZ3&yB8*pN54
   ```
7. **Summary Dashboard:** Prints a full report detailing parsed rows, newly created users, updated profiles, and any encountered errors.

---

## 3. Creating an Organizer Account (`scripts/create-organizer.ts`)

Organizers possess elevated permissions, allowing them to:

- Manage hackathon schedule events and announce urgent broadcasts.
- Publish and modify leaderboard round scores.
- View and update participant profiles and team assignments.
- Unlock problem statements and manage campus transit routes.

### Command Usage

```bash
# Basic usage (generates strong random password automatically)
npm run create:organizer -- --email organizer@prayatna.org --name "Suresh Verma"

# Custom password specification
npm run create:organizer -- --email lead@prayatna.org --name "Pooja Sharma" --password "Prayatna#Admin2026"
```

### CLI Options:

- `--email <email>`: Organizer email address (defaults to `organizer@prayatna.org`).
- `--name <name>`: Full name of organizer (defaults to `Lead Organizer`).
- `--password <password>`: Explicit initial password (auto-generates a secure 18-character password if omitted).

### What Happens:

1. Provisions or retrieves the user in `auth.users` with `email_confirm: true`.
2. Upserts `public.profiles` setting `role = 'organizer'`.
3. Displays the account details and password confirmation in your terminal.

---

## 4. Seeding Sample Database Records (`supabase/seed.sql`)

The repository includes a comprehensive, realistic seed file at `supabase/migrations` / `supabase/seed.sql` for local testing and demonstration.

### What is Included in the Seed Data:

- **3 Teams:** `Algorhythms`, `ByteCoders`, and `NeuralKnights`.
- **10 Schedule Events:** Spread across 2 days, including an event that **crosses midnight** (`Midnight Jam & Energy Recharge`, starting 10:30 PM Oct 24 and ending 02:00 AM Oct 25).
- **4 Problem Statements:** 2 released in the past (accessible immediately) and 2 locked in the future (tested with countdown API `public.next_problem_release()`).
- **3 Announcements:** Highlighting normal, important, and urgent priority categories.
- **2 Transit Bus Routes with 10 Waypoints & Map Polylines:**
  - Route 1: Indore City Transit Express (5 stops + route path coordinates).
  - Route 2: Bhopal Intercity Hacker Shuttle (5 stops connecting Bhopal, Sehore, Dewas to Indore).
- **Published Leaderboard Scores with an Exact Tie:**
  - Round 1 and Round 2 scores creating an exact 175.0 point tie for Rank 1 between `Algorhythms` and `ByteCoders`.

### Applying Seed Data:

#### Using Supabase CLI:

```bash
supabase db reset
# or apply seed directly
supabase db query < supabase/seed.sql
```

#### Using Supabase Web Dashboard:

1. Open your Supabase Project Dashboard.
2. Navigate to the **SQL Editor**.
3. Copy and paste the contents of `supabase/seed.sql`.
4. Click **Run**. All inserts use `ON CONFLICT DO UPDATE` or `DO NOTHING`, making the seed safe to re-run.

---

## 5. Security & Post-Import Checklist

- [ ] Verify participant counts in the Supabase Dashboard under `Authentication -> Users` and `Table Editor -> profiles`.
- [ ] Distribute temporary passwords to participants securely via official event mailers or SMS.
- [ ] Instruct participants to change their password upon first login via the in-app settings screen.
- [ ] Securely archive or permanently delete `credentials.csv` after password distribution:
  ```bash
  rm credentials.csv
  ```
- [ ] Confirm `credentials.csv` and `participants.csv` are never staged in git:
  ```bash
  git status
  ```
