const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  ShadingType,
} = require('docx');

const PRIMARY_COLOR = '0F172A'; // Slate 900
const ACCENT_COLOR = '0284C7'; // Sky 600
const MUTED_COLOR = '64748B'; // Slate 500
const BG_LIGHT = 'F8FAFC'; // Slate 50

function createHeaderCell(text, widthPercent) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: PRIMARY_COLOR },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            color: 'FFFFFF',
            size: 20,
            font: 'Arial',
          }),
        ],
      }),
    ],
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
  });
}

function createDataCell(text, widthPercent, isAlternate = false, isBold = false) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: isAlternate ? { type: ShadingType.CLEAR, fill: BG_LIGHT } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isBold,
            color: '1E293B',
            size: 19,
            font: 'Arial',
          }),
        ],
      }),
    ],
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
  });
}

function buildDocument() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22,
            color: '334155',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Prayatna Companion — Engineering Architecture & Progress Report',
                    size: 16,
                    color: MUTED_COLOR,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 16,
                    color: MUTED_COLOR,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: MUTED_COLOR,
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 16,
                    color: MUTED_COLOR,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: MUTED_COLOR,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: 'PRAYATNA COMPANION',
                bold: true,
                size: 48,
                color: PRIMARY_COLOR,
                font: 'Arial',
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Phase 1 & Phase 2 Engineering Architecture, Foundations & Quality Assurance Report',
                bold: true,
                size: 24,
                color: ACCENT_COLOR,
                font: 'Arial',
              }),
            ],
            spacing: { after: 300 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: BG_LIGHT },
                    margins: { top: 160, bottom: 160, left: 200, right: 200 },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT_COLOR },
                      top: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Project Name: ', bold: true }),
                          new TextRun('Prayatna Companion Mobile Application\n'),
                          new TextRun({ text: 'Application Framework: ', bold: true }),
                          new TextRun('Expo (SDK 57) / React Native (0.86) with Expo Router\n'),
                          new TextRun({ text: 'Language & Typing: ', bold: true }),
                          new TextRun(
                            'TypeScript (Strict Mode, noUncheckedIndexedAccess, 0 "any")\n'
                          ),
                          new TextRun({ text: 'Error Monitoring & CI/CD: ', bold: true }),
                          new TextRun('Sentry for React Native, GitHub Actions, EAS Build\n'),
                          new TextRun({ text: 'Current Status: ', bold: true }),
                          new TextRun('Phase 1 & Phase 2 100% Complete & Verified Green\n'),
                          new TextRun({ text: 'Document Prepared For: ', bold: true }),
                          new TextRun('Engineering Leadership & Senior Mentors'),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // Section 1: Executive Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '1. Executive Summary',
                bold: true,
                size: 32,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun(
                'Prayatna Companion is the official mobile application for participants, mentors, and judges of the Prayatna 2026 Hackathon. ' +
                  'The application serves as the centralized digital hub for event schedules, track-based problem statements, live leaderboard rankings, team identity, and venue connectivity. ' +
                  'Phase 1 established the application architecture, routing layout, secure authentication storage, and design tokens. ' +
                  'Phase 2 established enterprise-grade engineering foundations: strict compiler safety, automated pre-commit hooks, automated GitHub Actions CI, production Sentry crash monitoring with privacy controls, a zero-console PII-redacting logger, and a comprehensive Jest test suite exceeding an 80% coverage threshold.'
              ),
            ],
            spacing: { after: 240 },
          }),

          // Section 2: Technology Stack & Architecture
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '2. Technology Stack & Key Dependencies',
                bold: true,
                size: 32,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Library / Tool', 30),
                  createHeaderCell('Version', 20),
                  createHeaderCell('Architectural Role & Purpose', 50),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Expo SDK', 30, false, true),
                  createDataCell('57.0.30', 20),
                  createDataCell(
                    'Native toolchain, continuous native build pipeline (Expo Go Play Store compatible).',
                    50
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Expo Router', 30, true, true),
                  createDataCell('57.0.28', 20, true),
                  createDataCell(
                    'Type-safe file-system based routing and screen navigators.',
                    50,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('@supabase/supabase-js', 30, false, true),
                  createDataCell('2.118.0', 20),
                  createDataCell(
                    'Authentication, PostgreSQL client, and Realtime websocket protocol.',
                    50
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('@sentry/react-native', 30, true, true),
                  createDataCell('7.11.0', 20, true),
                  createDataCell(
                    'Production crash reporting, breadcrumb tracking, and EAS source maps integration.',
                    50,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('@tanstack/react-query', 30, false, true),
                  createDataCell('5.104.3', 20),
                  createDataCell(
                    'Server-state management, automated retries, and stale-while-revalidate caching.',
                    50
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('expo-secure-store', 30, true, true),
                  createDataCell('57.0.4', 20, true),
                  createDataCell(
                    'Hardware-backed encrypted storage with transparent chunking adapter.',
                    50,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('jest & jest-expo', 30, false, true),
                  createDataCell('29.7.0 / 57.0', 20),
                  createDataCell('Unit testing runtime enforcing >= 80% coverage threshold.', 50),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('zustand', 30, true, true),
                  createDataCell('5.0.15', 20, true),
                  createDataCell(
                    'Lightweight reactive state management for authentication and session state.',
                    50,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('zod', 30, false, true),
                  createDataCell('4.6.7', 20),
                  createDataCell('Strict schema validation for startup environment variables.', 50),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // Section 3: Engineering Solutions & Standards
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '3. Core Engineering Solutions (Phase 1 & 2)',
                bold: true,
                size: 32,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.1 Sentry Crash Monitoring & Privacy Guard',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Integrated @sentry/react-native with dynamic environment tagging (development vs production) and release identifiers (prayatna-companion@1.0.0). ' +
                  'In adherence to security and privacy guidelines, only user.id is attached to events; emails, phone numbers, and names are strictly excluded. ' +
                  'A custom Root ErrorBoundary catches unexpected React crashes, forwards telemetry to Sentry, and presents users with a clean recovery screen and an accessible Restart button.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.2 Secure Structured Logger with PII Redaction',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Direct console.log is completely disallowed across the codebase. All logging flows through src/shared/lib/logger.ts. ' +
                  'The logger recursively sanitizes contexts against sensitive regex patterns (tokens, passwords, keys, secrets, credentials, emails, and phone numbers), replacing values with [REDACTED]. ' +
                  'In development, logs output formatted timestamps to console; in production, logs record Sentry breadcrumbs and captured exceptions.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.3 SecureStore 2048-Byte Keystore Chunking Adapter',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Android Keystore and iOS Keychain enforce a 2048-byte limit per key-value entry. ' +
                  'Supabase session tokens typically measure 2.5KB-4KB. ' +
                  'Our SecureStoreChunkingAdapter divides payloads into 1800-byte chunks with indexed keys and a chunk count header, atomically reassembling them on retrieval and deleting leftover chunks on renewal.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.4 The 5-State Screen Architecture Contract',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Every screen in the application utilizes <ScreenState> to handle five distinct UX states: Loading (skeleton matching layout), Success (clean render with zero layout shift), Empty (contextual glyph and message), Error (friendly explanation + Retry button), and Offline (alert banner + cached data).'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.5 Supabase Database Schema & Security Architecture',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Created the initial database migration supabase/migrations/0001_init.sql featuring 9 core tables (teams, profiles, schedule_events, problem_statements, announcements, leaderboard_entries, bus_routes, bus_stops, bus_route_paths). ' +
                  'Enforces UUID primary keys with gen_random_uuid(), timestamptz columns, and RLS on every table. ' +
                  'Key security assets include security definer functions (is_organizer, next_problem_release, server_now), a before-update trigger preventing non-organizers from altering their role or team_id, locked problem releases (release_at <= now()), locked leaderboard entries (published = true), a security-invoker leaderboard_view with dense_rank() and round breakdowns, and realtime publication registration with full replica identity.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.6 Seed Data, Administrative CLI Automation & Documentation',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Implemented realistic seed dataset supabase/seed.sql (3 teams, 10 schedule events with midnight crossover, 4 problem statements with past and future release windows, 3 prioritized announcements, 2 transit routes for Indore and Bhopal with 5 stops each and geo-coordinates, and a published leaderboard with a 175-point tie). ' +
                  'Built administrative CLI scripts scripts/import-participants.ts (bulk participant provisioning, team upserts, temporary password generation, rate limiting, and credentials.csv export) and scripts/create-organizer.ts (direct organizer provisioning), documented thoroughly in docs/ADMIN.md.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.7 Themeable Design System, Composed Skeletons & ScreenState',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Developed a full themeable design system in src/shared/ui/ including Text (9 typography variants with dynamic font scaling), Button (primary, secondary, ghost, outline, danger with loading spinner and disabled states), Card (default, elevated, outlined, glow with haptics), Badge & Chip (semantic pill badges and selectable filter chips), Input (focus rings, error alerts, helper texts), Avatar (initials generation, presence status dots), Divider (horizontal, vertical, and labeled), and BottomSheet (slide-up dialog with gesture backdrop dismiss). ' +
                  'Engineered a Reanimated shimmer Skeleton primitive respecting device reduce-motion settings, along with 7 composed skeletons matching exact production layouts (Home, Schedule, Announcements, Problems, Leaderboard podium, Transit, Profile). ' +
                  'Standardized the 5-State Architecture through ScreenState coordinating TanStack Query results, ErrorState with refetch, EmptyState with custom actions, and NetInfo-driven OfflineBanner. Included an isolated developer-only preview screen app/dev/ui-kit.tsx.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.8 Data Layer, Synchronization, Error Mapping & Realtime Architecture',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Engineered an enterprise data synchronization foundation featuring: ' +
                  '(1) Generated Supabase TypeScript types with automated npm script "gen:types" and comprehensive Zod schemas across all feature domains (teams, profile, schedule, problems, announcements, leaderboard, transit) with strict type derivation. ' +
                  '(2) Centralized error handling layer with typed AppError class and mapToAppError() translating PostgREST, Supabase Auth, network drops, timeouts, and Zod errors to friendly user messages, guaranteeing raw errors and secrets are never surfaced to the UI. ' +
                  '(3) TanStack Query setup with resource-specific stale times (schedule 60s, announcements 15s, leaderboard 10s, problems 30s, bus 10min), exponential backoff retries exclusively on retryable errors, focusManager & onlineManager synchronization, and AsyncStorage persistence. ' +
                  '(4) Server time synchronization calling RPC server_now() with latency adjustment, exposing useServerNow() for accurate live countdowns. ' +
                  '(5) Resilient Realtime Manager subscribing to database tables with reference counting, automatic reconnection with backoff, 30s polling fallback, and cache invalidation. ' +
                  '(6) Centralized IST date utilities for calendar day grouping across midnight, active/upcoming event resolution, and countdown formatting.'
              ),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.9 Authentication Feature, Protected Session Gate, Profile Watcher & More Tab',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Delivered the end-to-end hacker authentication and profile management system: ' +
                  '(1) Hacker Login Screen (app/(auth)/login.tsx) with dark/light theming, email & password fields with inline Zod validation, password show/hide toggle, loading indicator on submission, distinct messages for invalid credentials vs network errors, and "Forgot password? Contact the organizers." notice without public self-registration. ' +
                  '(2) Reactive useSession hook providing session state and flash notices (authNotice) for redirect warnings. ' +
                  '(3) TanStack Query useProfile hook joining profiles with teams, auto-enforcing sign-out if a profile row is missing or if the token is revoked/account deleted. ' +
                  '(4) Cold start zero-flicker splash screen pre-verification in app/_layout.tsx ensuring authenticated users transition smoothly to tabs while invalid sessions land on login. ' +
                  '(5) Account & More Tab (app/(tabs)/more.tsx) with 5-state presentation, ProfileCard displaying participant initials avatar, online badge, team name, and squad code, direct navigation to Announcements Feed, hackathon Wi-Fi / help desk resources card, native confirmation sign-out dialogs, and cache purging (both in-memory TanStack query cache and persisted AsyncStorage cache) on logout.'
              ),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.10 Real-Time Event Features: Schedule, Announcements, & Live Home Dashboard',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Engineered core interactive event features integrating Supabase Realtime synchronization and authoritative server-corrected time: ' +
                  '(1) Schedule Timeline (app/(tabs)/schedule.tsx): Segmented control day selector ("All Days", "Day 1", "Day 2", etc.), timeline event list showing IST time range, venue location with pin indicator, and colored chips per event type (ceremony, session, workshop, jamming, judging, meal, other). Live highlight for current active event with glowing border and "LIVE NOW" badge. Server-corrected authoritative time ticking every 30s via useServerNow({ intervalMs: 30000 }) automatically advancing active events. Full handling of midnight-crossing events (visible on both days with a "(+1 Day)" indicator) and concurrent overlapping events. 5-state handling with ScheduleSkeleton, EmptyState, ErrorState with retry, OfflineBanner, and pull-to-refresh. ' +
                  '(2) Announcements Feed (app/announcements.tsx): Reverse-chronological feed with priority badges (normal, important, urgent with red left border and warning tint), relative timestamps (Just now, 5m ago, 2h ago, 3d ago, or IST date) via formatRelativeTime(), expandable long text with smooth 3-line truncation and accessible toggle button (touch target >= 44px), priority filter chips ("All", "Urgent", "Important"), back navigation, and 5-state handling with AnnouncementListSkeleton. ' +
                  '(3) Home Overview Dashboard (app/(tabs)/index.tsx): Welcomes participant by first name (useProfile), displaying team name and squad code. "Happening Now / Up Next" hero card with live IST event time, category badge, location, and high-visibility countdown timer updating every second via useServerNow({ intervalMs: 1000 }). Latest 3 announcements preview with immediate shortcut ("View all →") to full announcements feed. Zero-layout-shift HomeSkeleton loading state and multi-resource pull-to-refresh. ' +
                  '(4) Realtime Synchronization: Subscribed to schedule_events and announcements tables with automatic query cache invalidation on inserts, updates, and deletes.'
              ),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3.11 Problem Statements Track, Live Locked Countdown & Markdown Detail Screen',
                bold: true,
                size: 26,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 140, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Engineered the Problem Statements track discovery and secure release module: ' +
                  '(1) Database RLS & RPC Security: Problem statements are strictly protected by Postgres RLS (release_at <= now() or is_organizer()), completely hiding unreleased tracks from network access. Implemented rpc next_problem_release() to retrieve upcoming countdown targets without leaking problem metadata. ' +
                  '(2) Locked Countdown Card (LockedReleaseCard): Displays live countdown ticking every second via useServerNow({ intervalMs: 1000 }), automatically correcting for client device clock skew. Seamlessly fires onCountdownZero when timer expires, invalidating TanStack query caches and revealing newly released problem statements. Subscribed to Realtime changes on problem_statements table. ' +
                  '(3) Problem Statements List (app/(tabs)/problems.tsx): 5-state screen architecture with ProblemCardSkeleton, ErrorState with retry, and EmptyState ("Problem statements will appear here when released") with the Locked countdown card rendered above it if an upcoming release is scheduled. FlatList with pull-to-refresh and ProblemCard items displaying code, domain, difficulty, and excerpt. ' +
                  '(4) Safe Markdown Detail Screen (app/problems/[id].tsx & MarkdownRenderer): Dedicated screen with accessible back button, metadata badges, and formatted IST release timestamp. Custom MarkdownRenderer with sanitizeHtml() stripping all HTML tags to prevent XSS/HTML injection, safely rendering headings, code blocks with syntax languages, blockquotes, ordered/unordered lists, and inline formatting for large 5,000+ character specifications.'
              ),
            ],
            spacing: { after: 200 },
          }),

          // Section 4: Quality Assurance & Test Verification
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '4. Quality Assurance & Verification Results',
                bold: true,
                size: 32,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Verification Gate', 25),
                  createHeaderCell('Command', 25),
                  createHeaderCell('Status', 15),
                  createHeaderCell('Verified Details & Outcomes', 35),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Strict TypeScript', 25, false, true),
                  createDataCell('npm run typecheck', 25),
                  createDataCell('PASSED', 15, false, true),
                  createDataCell('0 errors. noUncheckedIndexedAccess: true. Zero "any".', 35),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('ESLint Analysis', 25, true, true),
                  createDataCell('npm run lint', 25, true),
                  createDataCell('PASSED', 15, true, true),
                  createDataCell(
                    '0 errors, 0 warnings. Flat config with Expo & import sorting.',
                    35,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Code Formatting', 25, false, true),
                  createDataCell('npm run format:check', 25),
                  createDataCell('PASSED', 15, false, true),
                  createDataCell('100% of files strictly conform to Prettier specifications.', 35),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Unit Test Suite', 25, true, true),
                  createDataCell('npm run test:ci', 25, true),
                  createDataCell('PASSED', 15, true, true),
                  createDataCell(
                    '49 test suites passed, 321/321 tests green. > 80% coverage.',
                    35,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Expo Doctor', 25, false, true),
                  createDataCell('npx expo-doctor', 25),
                  createDataCell('PASSED', 15, false, true),
                  createDataCell('21/21 checks passed. No dependency or configuration issues.', 35),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // Section 5: Coverage Metrics
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '5. Jest Code Coverage Metrics',
                bold: true,
                size: 32,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Module / Directory', 30),
                  createHeaderCell('% Statements', 17),
                  createHeaderCell('% Branch', 17),
                  createHeaderCell('% Functions', 18),
                  createHeaderCell('% Lines', 18),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell(
                    'src/features/ (Problems, Schedule, Announcements, Auth)',
                    30,
                    false,
                    true
                  ),
                  createDataCell('95.73%', 17),
                  createDataCell('83.21%', 17),
                  createDataCell('95.83%', 18),
                  createDataCell('95.69%', 18),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('src/shared/hooks/ (Theme, Server Time)', 30, true, true),
                  createDataCell('96.87%', 17, true),
                  createDataCell('87.50%', 17, true),
                  createDataCell('92.85%', 18, true),
                  createDataCell('96.55%', 18, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('src/shared/lib/ (Errors, Realtime, Time, etc.)', 30, false, true),
                  createDataCell('93.91%', 17),
                  createDataCell('85.71%', 17),
                  createDataCell('81.96%', 18),
                  createDataCell('94.03%', 18),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('src/shared/ui/ (Design System & Skeletons)', 30, true, true),
                  createDataCell('94.84%', 17, true),
                  createDataCell('86.33%', 17, true),
                  createDataCell('100%', 18, true),
                  createDataCell('95.93%', 18, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('src/shared/utils/ (Asia/Kolkata Date)', 30, false, true),
                  createDataCell('99.12%', 17),
                  createDataCell('90.00%', 17),
                  createDataCell('100%', 18),
                  createDataCell('100%', 18),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('All Monitored Codebase Files', 30, true, true),
                  createDataCell('95.09%', 17, true, true),
                  createDataCell('86.63%', 17, true, true),
                  createDataCell('93.95%', 18, true, true),
                  createDataCell('95.37%', 18, true, true),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // Section 6: Strategic Roadmap
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '6. Strategic Roadmap for Subsequent Phases',
                bold: true,
                size: 32,
                color: PRIMARY_COLOR,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '• Phase 3 — Problem Statements & Track Releases [COMPLETE]: ',
                bold: true,
              }),
              new TextRun(
                'Released problem statement listings, time-locked release countdown with auto-transition, safe Markdown renderer with XSS prevention, and detail view.\n'
              ),
              new TextRun({ text: '• Phase 4 — Real-Time Leaderboard: ', bold: true }),
              new TextRun(
                'Build podium top 3 display, round-based evaluation filter, tie handling, and live score sync via Supabase Realtime.\n'
              ),
              new TextRun({
                text: '• Phase 5 — Offline Caching & Transit Route Navigation: ',
                bold: true,
              }),
              new TextRun(
                'Campus bus route schedules, stops, and polyline route mapping with offline resilience.\n'
              ),
              new TextRun({ text: '• Phase 6 — Production Cloud Builds & EAS: ', bold: true }),
              new TextRun(
                'Execute automated EAS builds with release profiles for Google Play and iOS TestFlight.'
              ),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  return doc;
}

async function run() {
  const doc = buildDocument();
  const outputPath = path.resolve(__dirname, '../docs/Prayatna_Companion_Progress_Report.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Word report successfully generated at: ${outputPath}`);
}

run().catch((err) => {
  console.error('Error generating document:', err);
  process.exit(1);
});
