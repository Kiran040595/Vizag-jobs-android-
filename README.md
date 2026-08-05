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
- Share jobs (native / WhatsApp / Telegram / copy link), similar jobs, guest + student Q&A
- Reply notifications, site feedback, blog reader, in-app legal pages
- Deep links from `jobsinvizag.in` job URLs; external apply via in-app browser (Custom Tabs)
- External apply channel prompt + post-apply group link
- Instagram / Latest jobs quick filter
- Bottom tabs: Jobs · Saved · Account

## Features (v3 — employer + admin mobile portals)

- Employer registration, sign-in, password reset, and company profile management
- Submit and edit jobs for admin review, with internal or external apply modes
- Track job approval status and applicant counts
- Review applicant contact details and resumes, then update application status
- Admin mobile review queue to approve or reject employer-submitted jobs
- Admin access to job applications; the full CMS remains available on the web

## Features (v4 — must-have retention + release)

- **Cloud-synced saved jobs** for signed-in students (local + account sync)
- **Job alerts** screen: category picks, email subscribe, push toggle
- **Push / local notifications** for application status and Q&A replies
- Optional Supabase migration: `supabase/migrations/20260805_must_have_cloud_sync.sql`
- EAS config (`eas.json`) + app version `1.1.0` for Play Store / release builds

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
(same as `VITE_SUPABASE_*` on jobsinvizag.in). Copy `.env.example` to `.env` to
override:

```
EXPO_PUBLIC_SUPABASE_URL=https://fbyyfyhdglcpkhxskffj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_SUPABASE_JOBS_TABLE=jobs
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
