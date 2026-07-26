# Vizag Jobs — Android app (React Native / Expo)

A React Native (Expo) Android app for **Jobs in Vizag** — a job portal for
Visakhapatnam. It is a mobile replica of the web app
([Kiran040595/vizag-jobs](https://github.com/Kiran040595/vizag-jobs),
`jobsinvizag.in`), reusing the same Supabase `jobs` data model and filtering
logic.

## Features (v1 — job-seeker experience)

- Browse the latest job openings in Visakhapatnam
- Search by title, company, skills, or location
- Filter by category (IT, engineering branches, banking, BPO, sales, HR,
  healthcare, education, hospitality, logistics, fresher, walk-in, …) and job type
- Job detail screen with full description and one-tap **Apply**
- Save jobs locally and revisit them on the **Saved Jobs** screen
- Live stats (active jobs, companies hiring, new this week, categories)

Data comes from Supabase when credentials are configured, otherwise the app
falls back to bundled **sample Vizag jobs** so it runs with zero setup.

## Getting started

### Quick start (one command)

```bash
npm run setup      # installs deps, Android SDK packages, and runs expo prebuild
source scripts/env.sh
npm run web        # preview in browser (no device needed)
```

### Manual setup

**Prerequisites:** Node 22+, JDK 21, Android SDK (API 36, build-tools 36, NDK 27).

```bash
npm install
bash scripts/setup-android-sdk.sh   # installs Android SDK if missing
source scripts/env.sh               # sets JAVA_HOME and ANDROID_HOME
npm run prebuild:android            # generates the android/ folder
```

### Running the app

```bash
npm run web        # run in the browser (react-native-web)
npm run android    # build & install on a connected Android device/emulator
npm start          # Expo dev server (scan QR with Expo Go on a phone)
npm run build:apk  # build a debug APK (output in android/app/build/outputs/apk/debug/)
```

### Supabase (optional, for live data)

Copy `.env.example` to `.env` and fill in your project's values (the same as the
web app's `VITE_SUPABASE_*`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run setup` | Full environment bootstrap (deps + SDK + prebuild) |
| `npm run web` / `android` / `ios` | Start the app on a target platform |
| `npm run prebuild:android` | Generate native `android/` project from Expo config |
| `npm run build:apk` | Build a debug APK with Gradle |
| `npm run lint` | ESLint (expo config) |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Jest unit tests (filter/pagination logic) |

## Tech stack

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · React Navigation ·
`@supabase/supabase-js` · AsyncStorage.
