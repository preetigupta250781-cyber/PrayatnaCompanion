# Prayatna Companion — Engineering Progress & Architecture Report

**Project Name:** Prayatna Companion  
**Application Type:** Cross-Platform Mobile Application (iOS & Android)  
**Framework:** Expo (SDK 57) / React Native (0.86) with Expo Router  
**Primary Language:** TypeScript (Strict Mode, 100% Type Safe, Zero `any`)  
**Backend & Database:** Supabase  
**Status:** Phase 1 Complete (Foundation, Architecture, Security, Theming & Navigation)  
**Last Updated:** October 2026  

---

## 1. Executive Summary

**Prayatna Companion** is an official companion mobile application built for participants, mentors, and organizers of the **Prayatna 2026 Hackathon**. The app serves as the centralized digital hub for:
- Live event scheduling and timeline updates
- Track-specific problem statements and submission criteria
- Real-time leaderboard scoring and commit evaluation
- Participant authentication, team identity, and venue connectivity resources

The primary technical objective of Phase 1 was to establish an enterprise-grade, maintainable foundation using modern mobile engineering best practices, strict TypeScript enforcement, robust state management, and high-security persistent authentication.

---

## 2. Technology Stack & Key Dependencies

| Technology / Library | Version | Purpose in Application |
|---|---|---|
| **Expo SDK** | `~57.0.30` | Core mobile application framework and native toolchain (Play Store Expo Go compatible) |
| **React Native** | `0.86.3` | Cross-platform UI runtime |
| **Expo Router** | `~57.0.28` | File-based, type-safe navigation system |
| **TypeScript** | `~6.0.3` | Compile-time type safety with `"strict": true` |
| **@supabase/supabase-js** | `^2.118.0` | Backend-as-a-Service client (Auth, Database, Realtime) |
| **@tanstack/react-query** | `^5.104.3` | Asynchronous server-state management and query caching |
| **zustand** | `^5.0.15` | Lightweight client-side reactive state management |
| **expo-secure-store** | `~58.0.2` | Hardware-backed encrypted key-value storage (Keychain / Keystore) |
| **zod** | `^4.6.7` | Runtime schema validation for environment variables |
| **react-native-reanimated** | `4.7.1` | High-performance 60/120fps native thread UI animations |
| **react-native-maps** | `1.29.11` | Interactive map rendering for venue navigation |
| **expo-haptics** | `~58.0.7` | Native tactile feedback for user interactions |
| **@react-native-async-storage/async-storage** | `2.2.0` | Client-side unencrypted offline storage |
| **@react-native-community/netinfo** | `12.0.1` | Network reachability detection and offline awareness |
| **date-fns & date-fns-tz** | `^4.4.0` / `^3.2.0` | Timezone-aware date calculations for hackathon timelines |

---

## 3. Architecture & Project Organization

The codebase follows a **Feature-Sliced / Clean Architecture** pattern to guarantee strict separation of concerns, scalability, and code maintainability:

```
├── app/                                 # Expo Router Route Screens (Route layer ONLY)
│   ├── (auth)/                          # Unauthenticated Route Group
│   │   ├── _layout.tsx                  # Stack layout for auth screens
│   │   └── login.tsx                    # Hackathon login portal
│   ├── (tabs)/                          # Authenticated Route Group
│   │   ├── _layout.tsx                  # Tab bar configuration & theming
│   │   ├── index.tsx                    # Overview Dashboard
│   │   ├── schedule.tsx                 # Timeline & Schedule
│   │   ├── problems.tsx                 # Problem Statement Tracks
│   │   ├── leaderboard.tsx              # Live Rankings
│   │   └── more.tsx                     # Settings & Venue Info
│   ├── _layout.tsx                      # Root layout (QueryClientProvider + Auth Gate)
│   └── index.tsx                        # Root route redirector
├── src/                                 # Business Logic & Core Implementation
│   ├── config/                          # App Configuration & Design Tokens
│   │   ├── env.ts                       # Startup Zod environment validation
│   │   └── theme.ts                     # Dark hackathon theme & centralized ACCENT_COLOR
│   ├── features/                        # Feature-Driven Business Modules
│   │   └── auth/                        # Authentication Feature
│   │       ├── model/auth-store.ts      # Zustand auth state store
│   │       └── index.ts                 # Public feature barrel export
│   └── shared/                          # Cross-Cutting Shared Modules
│       ├── hooks/use-theme.ts           # System appearance & theme hook
│       ├── lib/query-client.ts          # Configured React Query client
│       ├── lib/supabase.ts              # Supabase client with SecureStore chunking
│       ├── ui/tab-icon.tsx              # Reusable tab icons
│       └── utils/                       # Shared utility functions
├── docs/                                # Project Documentation & Progress Reports
│   ├── PROJECT_PROGRESS_REPORT.md       # Markdown single source of truth
│   └── Prayatna_Companion_Progress_Report.docx # Microsoft Word executive report
└── scripts/
    └── generate-doc.js                  # Automated Word document generator
```

---

## 4. Engineering Solutions & Highlights

### 4.1. SecureStore 2KB Limit Resolution via Chunking Adapter
- **Problem:** Native storage backends (`iOS Keychain` and `Android Keystore`) enforced by `expo-secure-store` have strict payload size limits (typically 2048 bytes on Android Keystore). Supabase authentication sessions (containing JWT access tokens, refresh tokens, and serialized user metadata) frequently exceed 2.5KB–4KB, leading to silent failures or storage exceptions.
- **Solution:** Designed and implemented a transparent `SecureStoreChunkingAdapter`:
  - Enforces a conservative chunk boundary of 1800 bytes.
  - Automatically splits oversized payloads into indexed segments (`${key}__chunk_0`, `${key}__chunk_1`).
  - Writes a metadata header (`${key}__chunk_count`) for deterministic reassembly.
  - Reassembles segments atomically during `getItem`.
  - Cleans up obsolete chunks whenever new tokens are smaller than previous sessions.
  - Includes transparent fallback for web runtimes.

### 4.2. Fail-Fast Startup Environment Validation (`src/config/env.ts`)
- Configured compile-time and runtime Zod validation for required environment variables:
  - `EXPO_PUBLIC_SUPABASE_URL`: Must be present and formatted as a valid URL.
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Must be non-empty string.
- If missing or malformed, the app immediately halts at startup with descriptive diagnostics, preventing difficult-to-trace runtime network errors.

### 4.3. Seamless Authentication Gate & Splash Screen Synchronization
- **Splash Screen Persistence:** Native splash screen is locked on app launch using `SplashScreen.preventAutoHideAsync()`.
- **Session Resolution:** The root layout subscribes to `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`.
- **Flicker-Free Navigation Guard:**
  - If no session exists $\rightarrow$ seamlessly navigates to `/(auth)/login`.
  - If valid session exists $\rightarrow$ seamlessly navigates to `/(tabs)`.
  - Only after initial authentication status is fully settled is `SplashScreen.hideAsync()` invoked.

### 4.4. Dark Hackathon Design System (`src/config/theme.ts`)
- Features a high-contrast, futuristic dark theme tailored for developer hackathons:
  - Global Accent: `#00F0FF` (Electric Cyan), defined in a single location for global re-branding.
  - Deep dark surfaces (`#08090E`, `#10131B`, `#171C28`) with neon highlights and subtle borders (`#1E2538`).
  - Standardized scale tokens for `spacing`, `radius`, and `typography`.

---

## 5. Architectural Contracts & Core Standards

### 5.1 The 5-State Screen Contract
Every screen in Prayatna Companion must strictly adhere to the five-state design contract using `<ScreenState>`:
1. **Loading State:** Renders `<Skeleton>` layout matching the final page geometry. Spinners are banned except inside buttons.
2. **Error State:** Renders `<ErrorState>` with a friendly, human-readable message and an accessible Retry button (never raw exceptions).
3. **Empty State:** Renders `<EmptyState>` with a track/domain glyph, helpful context, and actionable guidance.
4. **Offline State:** Renders `<OfflineBanner>` at the top while rendering cached data if available.
5. **Success State:** Displays data seamlessly with no layout shift.

### 5.2 Date & Time Standardization (`Asia/Kolkata`)
All user-facing dates and countdowns are processed through `src/shared/utils/date.ts` using `date-fns` and `date-fns-tz`. The app explicitly enforces the `Asia/Kolkata` (IST) timezone, with unit tests covering midnight rollover and international device timezone discrepancies.

### 5.3 Secure Structured Logger (`src/shared/lib/logger.ts`)
Direct `console.log` is prohibited. All logging flows through `logger.info`, `logger.warn`, and `logger.error`, which automatically sanitizes and redacts PII, access tokens, and credentials.

---

## 6. Verification & Quality Assurance Summary

| Quality Check | Command Run | Result | Notes |
|---|---|---|---|
| **TypeScript Strictness** | `npm run typecheck` | **PASS (Exit 0)** | 0 type errors; strict mode + `noUncheckedIndexedAccess: true`. |
| **ESLint & Code Standards** | `npm run lint` | **PASS (Exit 0)** | 0 errors, 0 warnings. |
| **Unit Testing Suite** | `npm test` | **PASS (Exit 0)** | 12 tests passed across 2 test suites. |
| **Expo Metro Dev Server** | `npx expo start` | **PASS (Exit 0)** | Server booted cleanly; loaded `.env`; zero warnings. |
| **Cross-Platform Bundler** | `npx expo export` | **PASS (Exit 0)** | All 5 tabs and auth stack bundled cleanly for iOS, Android, and Web. |
| **Version Control & Security** | `git status` / `git log` | **PASS (Exit 0)** | Git initialized; `.env` excluded via `.gitignore`; clean tree. |

---

## 7. Development Roadmap for Upcoming Phases

- **Phase 2 (Database & Data Layer):**
  - Implement Supabase database schema for `teams`, `schedule_events`, `problem_tracks`, and `evaluations`.
  - Wire React Query hooks (`useSchedule`, `useProblems`, `useLeaderboard`) to fetch and cache data.
- **Phase 3 (Live Real-Time Subscriptions):**
  - Enable Supabase Realtime WebSocket listeners for instant leaderboard rank adjustments.
  - Implement announcements banner with live broadcast alerts.
- **Phase 4 (Venue Navigation & Offline Support):**
  - Integrate `react-native-maps` with offline caching for campus indoor/outdoor navigation.
  - Provide offline caching using NetInfo + AsyncStorage for schedule inspection without network.
