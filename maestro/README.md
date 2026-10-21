# Maestro E2E Testing Guide

This directory contains automated end-to-end (E2E) UI flows for the **Prayatna Companion** mobile app (`org.prayatna.companion`) using [Maestro](https://maestro.mobile.dev/).

---

## 1. Prerequisites & Installation

### Install Maestro CLI

- **macOS / Linux:**
  ```bash
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  ```
- Verify the installation:
  ```bash
  maestro --version
  ```

### Android Tools & Device Setup

- Ensure Android SDK platform tools are installed (`adb`).
- Check connected emulators or physical devices:
  ```bash
  adb devices
  ```
- Ensure USB debugging is enabled on physical devices, or launch an Android Virtual Device (AVD) from Android Studio.

---

## 2. Running E2E Tests

Ensure your development server or release build is running or installed on the device.

### Run All Flows

```bash
npm run e2e
```

_(Executes both `happy-path.yaml` and `login-failure.yaml` sequentially)._

### Run Individual Flows

- **Complete Happy Path:**

  ```bash
  npm run e2e:happy
  # or directly:
  maestro test maestro/happy-path.yaml
  ```

  _Flow:_ Launches app -> verifies Login screen -> authenticates participant -> asserts Home dashboard -> navigates Schedule tab -> navigates Problems tab -> navigates Leaderboard tab -> navigates More tab -> opens Bus Routes -> navigates back -> logs out -> verifies return to Login screen.

- **Failed Login Flow:**
  ```bash
  npm run e2e:failure
  # or directly:
  maestro test maestro/login-failure.yaml
  ```
  _Flow:_ Launches app -> inputs invalid email & password -> taps SIGN IN -> asserts error alert _"Invalid email or password. Please verify your credentials."_ -> verifies user is not admitted to Home dashboard.

---

## 3. Customizing Credentials

The happy path flow supports environment variable overrides for testing custom credentials:

```bash
PARTICIPANT_EMAIL="alice@medicaps.ac.in" PARTICIPANT_PASSWORD="CustomPassword123!" maestro test maestro/happy-path.yaml
```

If not provided, the flow defaults to:

- Email: `participant1@prayatna.org`
- Password: `Prayatna2026!`

---

## 4. Maestro Studio (Interactive Debugger)

To inspect view hierarchies and test new assertions interactively on your running emulator:

```bash
maestro studio
```

This opens a web UI at `http://localhost:9999` with an interactive screenshot of the device, element selector trees, and real-time command execution.
