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
const ACCENT_COLOR = '0284C7';  // Sky 600
const MUTED_COLOR = '64748B';   // Slate 500
const BG_LIGHT = 'F8FAFC';      // Slate 50
const BORDER_COLOR = 'CBD5E1';  // Slate 300

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
              top: 1440, // 1 inch
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
                    text: 'Prayatna Companion — Engineering Project Report',
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
          // Document Title
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

          // Subtitle
          new Paragraph({
            children: [
              new TextRun({
                text: 'Mobile Engineering Architecture & Progress Report',
                bold: true,
                size: 26,
                color: ACCENT_COLOR,
                font: 'Arial',
              }),
            ],
            spacing: { after: 300 },
          }),

          // Metadata Callout Box
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
                          new TextRun('Expo (SDK 58) / React Native (0.88) with Expo Router\n'),
                          new TextRun({ text: 'Language & Typing: ', bold: true }),
                          new TextRun('TypeScript (Strict Mode Enabled, 0 "any" types)\n'),
                          new TextRun({ text: 'Backend Infrastructure: ', bold: true }),
                          new TextRun('Supabase (Auth, Realtime, Postgres)\n'),
                          new TextRun({ text: 'Current Status: ', bold: true }),
                          new TextRun('Phase 1 Complete (Foundation, Security, Navigation, Theming)\n'),
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
                'Prayatna Companion is an official, cross-platform mobile application designed to serve as the real-time operational hub for participants, mentors, and judges during the Prayatna 2026 Hackathon. ' +
                'The system enables attendees to check live schedules, view track-based problem statements, track real-time scores on the leaderboard, receive immediate event announcements, and access essential campus network resources.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            children: [
              new TextRun(
                'Phase 1 focuses on establishing an enterprise-ready mobile foundation adhering to strict engineering standards: zero tolerance for untyped "any" declarations, runtime environment schema validation, hardware-backed secure storage with automated chunking, and flicker-free authentication routing.'
              ),
            ],
            spacing: { after: 240 },
          }),

          // Section 2: Technology Stack & Package Architecture
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
                  createDataCell('58.0.14', 20),
                  createDataCell('Native toolchain, runtime, and continuous native build pipeline.', 50),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Expo Router', 30, true, true),
                  createDataCell('58.0.23', 20, true),
                  createDataCell('Type-safe file-system based routing and screen navigators.', 50, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('@supabase/supabase-js', 30, false, true),
                  createDataCell('2.118.0', 20),
                  createDataCell('Authentication, PostgreSQL client, and Realtime websocket protocol.', 50),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('@tanstack/react-query', 30, true, true),
                  createDataCell('5.104.3', 20, true),
                  createDataCell('Server-state management, automated retries, and stale-while-revalidate caching.', 50, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('expo-secure-store', 30, false, true),
                  createDataCell('58.0.2', 20),
                  createDataCell('Encrypted storage via iOS Keychain and Android Keystore.', 50),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('zustand', 30, true, true),
                  createDataCell('5.0.15', 20, true),
                  createDataCell('Lightweight, boilerplate-free client state store for session and UI states.', 50, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('zod', 30, false, true),
                  createDataCell('4.6.7', 20),
                  createDataCell('Strict schema validation for startup environment variables.', 50),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('react-native-reanimated', 30, true, true),
                  createDataCell('4.7.1', 20, true),
                  createDataCell('Direct UI thread 60/120fps animations without JavaScript bridge lag.', 50, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('react-native-maps', 30, false, true),
                  createDataCell('1.29.11', 20),
                  createDataCell('Campus geospatial rendering and indoor venue positioning.', 50),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('expo-haptics', 30, true, true),
                  createDataCell('58.0.7', 20, true),
                  createDataCell('Tactile haptic feedback for user interactions and key events.', 50, true),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // Section 3: Architecture & Feature Organization
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '3. Architectural Design & Folder Hierarchy',
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
                'To maintain a clean separation of concerns, the project enforces a strict boundary between the routing layer and business logic:'
              ),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'app/ Directory: ', bold: true }),
              new TextRun('Dedicated purely to Expo Router route definitions, layout wrappers, and navigation hierarchy. No business domain logic or API clients are placed here.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'src/features/ Directory: ', bold: true }),
              new TextRun('Contains domain-driven feature modules (e.g., auth, schedule, leaderboard). Each feature encapsulates its own stores, hooks, and services.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'src/shared/ Directory: ', bold: true }),
              new TextRun('Cross-cutting concerns divided into ui (shared components like TabIcon), lib (Supabase client and QueryClient), hooks (useTheme), and utils.'),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'src/config/ Directory: ', bold: true }),
              new TextRun('Global app configurations, including startup Zod environment validation (env.ts) and the dark hackathon theme design tokens (theme.ts).'),
            ],
            spacing: { after: 200 },
          }),

          // Section 4: Key Engineering Accomplishments
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '4. Critical Engineering Solutions',
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
                text: '4.1 SecureStore 2048-Byte Keystore Limit Chunking Adapter',
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
                'Problem Statement: The Android Keystore / iOS Keychain provided by expo-secure-store restricts values to 2048 bytes per entry. Supabase authentication sessions (comprising access tokens, refresh tokens, and serialized user metadata) frequently exceed 2.5KB–4KB. Native calls fail silently or crash the application upon authentication.\n\n' +
                'Engineering Solution: Developed a custom SecureStoreChunkingAdapter implementing Supabase\'s SupportedStorage interface. Payloads are divided into 1800-byte chunks and saved with indexed keys along with a chunk count header. During session retrieval, all chunks are verified and reassembled atomically. When a session is updated or revoked, previous leftover chunks are automatically cleaned up.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '4.2 Startup Fail-Fast Environment Validation',
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
                'In src/config/env.ts, required environment variables (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY) are validated against a strict Zod schema at app initialization. If any required variable is omitted or invalid, execution halts immediately with a clear diagnostic message, preventing silent runtime communication failures in production.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '4.3 Native Splash Screen & Flicker-Free Auth Gate',
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
                'To eliminate the unauthenticated screen flash common in hybrid apps, SplashScreen.preventAutoHideAsync() holds the native splash screen while Supabase resolves the stored session. An authentication routing guard directs unauthenticated users to /(auth)/login and authenticated users to /(tabs). Once the route guard settles, SplashScreen.hideAsync() reveals the correct screen seamlessly.'
              ),
            ],
            spacing: { after: 140 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '4.4 Centralized Hackathon Design System',
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
                'In src/config/theme.ts, the global ACCENT_COLOR (#00F0FF - Electric Cyan) is defined in a single source location, powering both dark and light color palettes. The dark aesthetic leverages obsidian and deep navy tones (#08090E, #10131B, #171C28) combined with structured typography, border radius, and spacing scales.'
              ),
            ],
            spacing: { after: 200 },
          }),

          // Section 5: Verification & Quality Assurance Results
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '5. Quality Assurance & Verification Results',
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
                  createHeaderCell('Verification Gate', 28),
                  createHeaderCell('Command', 28),
                  createHeaderCell('Status', 14),
                  createHeaderCell('Outcome / Verification Details', 30),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Strict TypeScript', 28, false, true),
                  createDataCell('npm run typecheck', 28),
                  createDataCell('PASSED', 14, false, true),
                  createDataCell('0 errors. Zero "any" types across app/ and src/.', 30),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Metro Dev Server', 28, true, true),
                  createDataCell('npx expo start', 28, true),
                  createDataCell('PASSED', 14, true, true),
                  createDataCell('Boots clean, exports env, no warnings or deprecations.', 30, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Cross-Platform Bundle', 28, false, true),
                  createDataCell('npx expo export', 28),
                  createDataCell('PASSED', 14, false, true),
                  createDataCell('Bundled 100% of screens for iOS, Android, and Web.', 30),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Git Repository State', 28, true, true),
                  createDataCell('git status / log', 28, true),
                  createDataCell('PASSED', 14, true, true),
                  createDataCell('Clean tree. .env securely ignored; .env.example tracked.', 30, true),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // Section 6: Upcoming Phases & Roadmap
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
              new TextRun({ text: '• Phase 2 — Data Integration: ', bold: true }),
              new TextRun('Connect live Supabase Postgres schemas for teams, schedules, problem statements, and real-time score feeds using TanStack Query hooks.\n'),
              new TextRun({ text: '• Phase 3 — Real-Time Push & WebSockets: ', bold: true }),
              new TextRun('Deploy Supabase Realtime subscriptions to dynamically re-order the Leaderboard and broadcast emergency announcements to participants.\n'),
              new TextRun({ text: '• Phase 4 — Offline-First Caching & Maps: ', bold: true }),
              new TextRun('Leverage NetInfo, AsyncStorage, and react-native-maps to provide offline venue navigation and cached schedule inspection when event Wi-Fi is congested.\n'),
              new TextRun({ text: '• Phase 5 — Production Builds & EAS: ', bold: true }),
              new TextRun('Configure EAS Build profiles for iOS TestFlight and Android Google Play Internal App Sharing distribution.'),
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
