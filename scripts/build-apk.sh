#!/usr/bin/env bash
# Build a standalone APK with the JS bundle + production Supabase env embedded.
# Sideload-friendly: does not require Metro on the device/network.
#
# Output:
#   android/app/build/outputs/apk/release/app-release.apk  (preferred)
#   android/app/build/outputs/apk/debug/app-debug.apk      (fallback)
#   VizagJobs.apk                                          (repo-root copy)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=env.sh
source "$ROOT/scripts/env.sh"

# Ensure Metro/Expo can inline EXPO_PUBLIC_* during the Gradle JS bundle step.
# Prefer .env.example (has the real public anon key) over a missing/empty .env.
if [[ ! -f .env ]]; then
  echo "==> Creating .env from .env.example (production Vizag Jobs Supabase)"
  cp .env.example .env
else
  # Replace common README placeholders that would break live fetches.
  if grep -qE 'EXPO_PUBLIC_SUPABASE_ANON_KEY=.*[<>]' .env 2>/dev/null; then
    echo "==> .env has placeholder anon key — refreshing from .env.example"
    cp .env.example .env
  fi
fi

if [[ ! -d android ]]; then
  echo "==> android/ missing — running expo prebuild"
  CI=1 npx expo prebuild --platform android --no-install
fi

# Release builds always embed the JS bundle. Expo's template signs release with
# the debug keystore for local installs, which is what we want for sideloading.
APP_GRADLE="android/app/build.gradle"
if [[ -f "$APP_GRADLE" ]] && ! grep -q 'signingConfig signingConfigs.debug' "$APP_GRADLE"; then
  echo "==> Note: release signing may require a keystore; will fall back to debug APK if needed"
fi

# Force debug variants to also embed the JS bundle (for assembleDebug fallback).
# Without this, a sideloaded debug APK may boot an old/empty bundle or expect Metro.
if [[ -f "$APP_GRADLE" ]] && ! grep -q 'debuggableVariants' "$APP_GRADLE"; then
  echo "==> Patching android/app/build.gradle so debug APKs embed the JS bundle"
  python3 - <<'PY'
from pathlib import Path
path = Path("android/app/build.gradle")
text = path.read_text()
needle = "react {"
if needle in text and "debuggableVariants" not in text:
    text = text.replace(
        needle,
        "react {\n    // Embed JS in debug APKs so sideloaded installs work without Metro\n    debuggableVariants = []\n",
        1,
    )
    path.write_text(text)
    print("Patched react { debuggableVariants = [] }")
else:
    print("No patch applied (already present or react block missing)")
PY
fi

echo "==> Building release APK (embedded JS + production Supabase defaults)"
set +e
(cd android && ./gradlew assembleRelease --no-daemon)
RELEASE_STATUS=$?
set -e

APK=""
if [[ $RELEASE_STATUS -eq 0 && -f android/app/build/outputs/apk/release/app-release.apk ]]; then
  APK="android/app/build/outputs/apk/release/app-release.apk"
else
  echo "==> Release build unavailable (exit $RELEASE_STATUS) — building debug APK with embedded bundle"
  (cd android && ./gradlew assembleDebug --no-daemon)
  APK="android/app/build/outputs/apk/debug/app-debug.apk"
fi

if [[ ! -f "$APK" ]]; then
  echo "ERROR: APK not found at $APK" >&2
  exit 1
fi

cp -f "$APK" "$ROOT/VizagJobs.apk"
echo ""
echo "APK ready:"
echo "  $APK"
echo "  VizagJobs.apk (copy in repo root)"
ls -lh "$APK" "$ROOT/VizagJobs.apk"
