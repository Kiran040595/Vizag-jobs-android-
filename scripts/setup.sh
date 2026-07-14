#!/usr/bin/env bash
# Full React Native Android development environment setup.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Installing npm dependencies"
npm install

echo "==> Configuring Android SDK"
bash scripts/setup-android-sdk.sh

echo "==> Generating native Android project (expo prebuild)"
# shellcheck source=env.sh
source scripts/env.sh
CI=1 npx expo prebuild --platform android

echo ""
echo "Setup complete. Next steps:"
echo "  source scripts/env.sh"
echo "  npm run web       # preview in browser"
echo "  npm run android   # run on a connected device/emulator"
echo "  npm run build:apk # build a debug APK"
