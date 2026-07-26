#!/usr/bin/env bash
# Bootstrap Android SDK command-line tools for React Native / Expo development.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=env.sh
source "$SCRIPT_DIR/env.sh"

SDK_ROOT="$ANDROID_HOME"
CMDLINE_TOOLS="$SDK_ROOT/cmdline-tools/latest"

if [[ ! -x "$CMDLINE_TOOLS/bin/sdkmanager" ]]; then
  echo "Installing Android command-line tools into $SDK_ROOT ..."
  mkdir -p "$SDK_ROOT/cmdline-tools"
  TMP_ZIP="$(mktemp /tmp/cmdline-tools.XXXXXX.zip)"
  curl -fsSL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "$TMP_ZIP"
  TMP_DIR="$(mktemp -d)"
  unzip -q "$TMP_ZIP" -d "$TMP_DIR"
  rm -f "$TMP_ZIP"
  rm -rf "$CMDLINE_TOOLS"
  mv "$TMP_DIR/cmdline-tools" "$CMDLINE_TOOLS"
  rm -rf "$TMP_DIR"
fi

echo "Accepting Android SDK licenses ..."
yes | sdkmanager --licenses >/dev/null 2>&1 || true

echo "Installing required SDK packages ..."
sdkmanager --install \
  "platform-tools" \
  "platforms;android-36" \
  "build-tools;36.0.0" \
  "ndk;27.1.12297006" \
  "cmake;3.22.1"

echo "Android SDK ready at $ANDROID_HOME"
sdkmanager --list_installed | grep -E 'platform-tools|platforms;android|build-tools|ndk|cmake' || true
