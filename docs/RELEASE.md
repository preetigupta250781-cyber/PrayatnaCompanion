# Prayatna Companion — Production Release & Operations Manual

This document details the complete production release lifecycle, pre-release verification checklist, EAS cloud build procedures (AAB and standalone APK), Over-The-Air (OTA) update channels, Sentry source map integration, rollback protocols, and event rehearsal checklists for **Prayatna Companion** (`org.prayatna.companion`).

---

## 1. Pre-Release Verification Checklist

Every production release or major OTA deployment must satisfy all 6 mandatory operational gates before distribution:

```
[ ] GATE 1: CI Pipeline Green
    ├── TypeScript: npm run typecheck (0 errors)
    ├── ESLint: npm run lint (0 errors, 0 warnings)
    └── Prettier: npm run format:check (clean style compliance)

[ ] GATE 2: Test Suite & Coverage Threshold (>= 80%)
    └── npm run test:ci (All 62 suites passing, line coverage >= 80%)

[ ] GATE 3: Database & RLS Security Audit
    └── npm run test:rls (Assert participant cannot view future problems, unpublished leaderboard rows,
        other profiles, or modify protected tables; unauthenticated client blocked)

[ ] GATE 4: Sentry Error Reporting Verification
    ├── Production build transmits test crash/exception to Sentry project
    └── Stack trace properly symbolicated with source maps (no raw minified indices)

[ ] GATE 5: Offline & Airplane-Mode Resilience
    ├── Airplane Mode enabled on test device
    ├── Screens display cached TanStack Query data with sticky <OfflineBanner />
    └── Empty/Error states render gracefully with a functional Retry button when cache is cleared

[ ] GATE 6: Live Event Operational Rehearsal
    ├── Problem Statement Release: Countdown timer reaches zero, auto-transitions to released track list,
    │   and responds immediately to Realtime broadcast
    ├── Leaderboard Publishing: Round filter updates, dense ranking resolves ties accurately,
    │   and user's team highlight & "Jump to My Team" scroll function correctly
    └── Broadcast Announcements: Urgent banner highlights with high priority, feed updates
        in real time without requiring manual pull-to-refresh
```

---

## 2. EAS Build Profiles & Artifact Generation

The app is built and signed in the cloud via [Expo Application Services (EAS)](https://docs.expo.dev/eas/). Configuration is defined in [`eas.json`](file:///Users/aryan555/Documents/Projects/prayatna%20app/eas.json).

### Build Matrix

| Profile          | Platform      | Artifact Format             | Target / Purpose                     | OTA Channel   |
| ---------------- | ------------- | --------------------------- | ------------------------------------ | ------------- |
| `production`     | Android       | `.aab` (Android App Bundle) | Google Play Store publication        | `production`  |
| `production-apk` | Android       | `.apk` (Direct Executable)  | Sideloading, on-site event staff, QA | `production`  |
| `preview`        | Android       | `.apk` (Internal Testing)   | Pre-release staging & team testing   | `preview`     |
| `development`    | Android / iOS | Development Client          | Local native module debugging        | `development` |

### Environment Variables & EAS Secrets Setup

Before launching cloud builds, configure required secrets in the EAS dashboard or CLI:

```bash
# Authenticate EAS CLI
npx eas-cli@latest login

# Register production secrets
npx eas-cli@latest secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://cgpqcpyfrajzfdezqgnm.supabase.co" --type string
npx eas-cli@latest secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<SUPABASE_ANON_KEY>" --type string
npx eas-cli@latest secret:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "<GOOGLE_MAPS_API_KEY>" --type string
npx eas-cli@latest secret:create --name SENTRY_AUTH_TOKEN --value "<SENTRY_AUTH_TOKEN>" --type string
```

### Production Build Commands

#### 1. Android Store Build (AAB for Google Play Store)

```bash
npx eas-cli@latest build --platform android --profile production
```

- Produces an optimized, signed `.aab` with Google Play App Signing compatibility.
- Auto-increments `versionCode` in EAS remote store.
- Bundles Sentry source maps and links to the `production` OTA channel.

#### 2. Android Sideloading Build (Universal APK)

```bash
npx eas-cli@latest build --platform android --profile production-apk
```

- Produces an installable `.apk` that participants and organizers can directly download and install without Play Store dependency.
- Shares the same production configuration, optimizations, and Supabase endpoints.

#### 3. Preview Staging Build (APK for Internal Testing)

```bash
npx eas-cli@latest build --platform android --profile preview
```

---

## 3. Sentry Source Map Upload & Symbolication

Production crashes must be readable with unobfuscated TypeScript file paths, function names, and line numbers.

### Automated Upload via Config Plugin

In [`app.config.ts`](file:///Users/aryan555/Documents/Projects/prayatna%20app/app.config.ts):

```ts
plugins: [
  [
    '@sentry/react-native/expo',
    {
      url: 'https://sentry.io/',
      project: process.env.SENTRY_PROJECT || 'prayatna-companion',
      organization: process.env.SENTRY_ORG || 'prayatna-acm',
    },
  ],
],
```

When `SENTRY_AUTH_TOKEN` is present in the build environment, EAS automatically generates JavaScript source maps during bundling and uploads them directly to Sentry release `prayatna-companion@<version>`.

### Validating Sentry on Production Builds

1. In a staging/preview build, trigger a manual test error:
   ```ts
   import * as Sentry from '@sentry/react-native';
   Sentry.captureException(new Error('Prayatna Companion Release Verification Test Error'));
   ```
2. Navigate to your Sentry dashboard -> **Issues**.
3. Confirm the test error appears with:
   - Environment tagged as `production` (or `preview`).
   - Unminified stack trace pointing to TypeScript source lines (e.g., `src/features/...`).
   - Sentry user set only to participant UUID (zero PII logged).

---

## 4. Over-The-Air (OTA) Updates & Channels

EAS Update allows shipping immediate bug fixes and UI corrections directly to participant devices without app store re-review.

### Channel Architecture

- **`production` Channel:** Associated with `production` and `production-apk` builds.
- **`preview` Channel:** Associated with internal staging builds.

### Publishing an Update

Ensure tests and typechecks are clean before shipping an OTA update:

```bash
# 1. Verify quality gates
npm run typecheck && npm run lint && npm run test:ci

# 2. Publish to preview channel for testing
npx eas-cli@latest update --branch preview --message "Fix: Timeline midnight crossing format"

# 3. Publish to production channel
npx eas-cli@latest update --branch production --message "Hotfix: Leaderboard tie display adjustment"
```

### Runtime Compatibility Safety

[`app.config.ts`](file:///Users/aryan555/Documents/Projects/prayatna%20app/app.config.ts) sets:

```ts
runtimeVersion: {
  policy: 'appVersion',
}
```

This ensures updates compiled for version `1.0.0` will **never** be downloaded by older or newer native runtime binaries, preventing native crashes.

---

## 5. Rollback Procedures

If an unexpected regression or corrupt update reaches production devices, follow these rollback procedures immediately:

### A. Over-The-Air (OTA) Update Rollback (Emergency Hotfix)

If a bad JavaScript update was pushed to the `production` channel:

#### Method 1: Republish Known-Stable Update Group (Recommended)

1. List historical updates published to the branch:
   ```bash
   npx eas-cli@latest update:list --branch production
   ```
2. Identify the `GROUP ID` of the last stable update.
3. Republish that exact group to immediately supersede the bad update:
   ```bash
   npx eas-cli@latest update:republish --group <STABLE_UPDATE_GROUP_ID> --branch production
   ```

Participant devices will download the stable bundle on their next app cold launch.

#### Method 2: Point Channel to Rollback Branch

```bash
# Create a rollback branch at the known good commit
git checkout <stable-commit-hash>
npx eas-cli@latest update --branch rollback-hotfix --message "Rollback to stable commit"

# Repoint the production channel to the rollback branch
npx eas-cli@latest channel:edit production --branch rollback-hotfix
```

---

### B. Native Binary Rollback (Native Crash / Faulty Store Build)

If the regression involves native libraries, configuration plugins, or invalid permissions:

1. **For Sideloaded APK Users:**
   - Re-publish the download link for the previous stable `production-apk` artifact.
   - Instruct participants via broadcast announcement or SMS/email to reinstall.
2. **For Google Play Store Users:**
   - In Google Play Console -> **Production Track** -> **Release Dashboard**:
     - Click **Halt Rollout** immediately to prevent new users from downloading the affected version.
   - Revert the problematic git commit locally:
     ```bash
     git revert <commit-hash>
     ```
   - Re-run the production build (EAS automatically increments `versionCode`):
     ```bash
     npx eas-cli@latest build --platform android --profile production
     ```
   - Submit the emergency binary build with accelerated review notes:
     ```bash
     npx eas-cli@latest submit --platform android
     ```

---

## 6. Live Event Rehearsal Procedures

Conduct a dry-run of event-day operations in staging before hackathon commencement:

### Rehearsal 1: Problem Statement Time-Lock Expiry

1. In Supabase staging database or seed, set a problem's `release_at` to $T+60\text{ seconds}$.
2. Open the app on the **Problems** tab.
3. Observe the `LockedReleaseCard` counting down in real time using authoritative server time (`rpc next_problem_release()`).
4. When countdown reaches 00:00:00, verify:
   - Screen transitions smoothly from locked card to released problem card.
   - Detail screen opens without error and renders safe markdown.
   - Participants cannot read unreleased problems before zero.

### Rehearsal 2: Leaderboard Scoring & Live Ties

1. Insert new scores into `evaluations` / `leaderboard_entries` table.
2. Verify:
   - Realtime channel updates leaderboard within 1–2 seconds.
   - Teams with identical scores receive dense ranking without gaps.
   - User's team row glows and "Jump to My Team" button smoothly scrolls to the card.
   - Round selector filter accurately isolates individual round evaluations.

### Rehearsal 3: Urgent Broadcast Announcements

1. Insert an announcement with `priority = 'urgent'`.
2. Verify:
   - Announcement immediately appears at top of feed with red `URGENT` badge.
   - Home screen "Happening Now" section displays the announcement without page reload.
   - Markdown links and formatted text expand properly on tap.
