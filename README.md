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
- Save jobs locally and revisit them on the **Saved** tab
- Live stats (active jobs, companies hiring, new this week, categories)

## Features (v2 — student account)

- Student sign-in / registration (same Supabase auth + `student_profiles` as the web app)
- Forgot / reset password (deep link `vizagjobs://student/reset-password`)
- Complete profile (education, skills, career preferences, consents, resume upload)
- On-platform **Apply** for internal jobs, with cover note + resume
- **Applied jobs** status tracking (`job_applications`)
- Jobs for you (profile-based matching), freshness filters, pagination
- Share jobs, similar jobs, Q&A (including guest ask), reply notifications, site feedback
- Deep links to job detail (`/jobs/...`, `/job/...`) + in-app notification navigation
- Structured job descriptions, source attribution, expired-listing handling
- Pull-to-refresh on Jobs / Saved / Applied
- External apply channel prompt + post-apply group link
- Bottom tabs: Jobs · Saved · Account
- Employer / admin: open on the website (jobsinvizag.in)

Data comes from the same Supabase `jobs` project as
[jobsinvizag.in](https://jobsinvizag.in). Credentials default to that production
project (public anon key); override via `.env` if needed. On fetch failure the
app falls back to bundled **sample Vizag jobs**. Auth/apply flows use the live
Supabase project.

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

### Supabase (live Vizag Jobs data)

The app is wired to the production Vizag Jobs Supabase project by default
(same as `VITE_SUPABASE_*` on jobsinvizag.in). Credentials are embedded in the
client and also listed in `.env.example`.

**Important for APK builds:** run `npm run build:apk` (not a raw Gradle command).
That script copies `.env.example` → `.env` when needed, rejects README
placeholders like `<anon-key>`, and produces a sideloadable APK with the JS
bundle embedded so live jobs load without Metro.

To override the project, copy `.env.example` to `.env` and edit:

```
EXPO_PUBLIC_SUPABASE_URL=https://fbyyfyhdglcpkhxskffj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste the anon key from .env.example>
EXPO_PUBLIC_SUPABASE_JOBS_TABLE=jobs
```

Do not leave angle-bracket placeholders in `.env` — they are ignored and the
app falls back to the production key, but a bad non-placeholder key will break
live fetches and show sample jobs instead.
## Scripts

| Command | Description |
| --- | --- |
| `npm run setup` | Full environment bootstrap (deps + SDK + prebuild) |
| `npm run web` / `android` / `ios` | Start the app on a target platform |
| `npm run prebuild:android` | Generate native `android/` project from Expo config |
| `npm run build:apk` | Build a sideloadable APK with live Supabase env + embedded JS |
| `npm run lint` | ESLint (expo config) |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Jest unit tests (filter/pagination logic) |

## Tech stack

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · React Navigation ·
`@supabase/supabase-js` · AsyncStorage.
