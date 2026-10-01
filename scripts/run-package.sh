#!/bin/sh
set -eu

usage() {
  printf 'Usage: %s [arm64|x64]\n' "$0" >&2
  exit 2
}

if [ "$#" -eq 1 ] && { [ "$1" = '-h' ] || [ "$1" = '--help' ]; }; then
  printf 'Usage: %s [arm64|x64]\n' "$0"
  exit 0
fi

if [ "$#" -gt 1 ]; then
  usage
fi

architecture=${1:-$(uname -m)}
case "$architecture" in
  arm64|aarch64)
    app_path='release/build/mac-arm64/CB.app'
    build_arch='arm64'
    ;;
  x64|x86_64|amd64)
    app_path='release/build/mac/CB.app'
    build_arch='x64'
    ;;
  *)
    usage
    ;;
esac

if [ ! -d "$app_path" ]; then
  printf 'Packaged %s app not found: %s\n' "$build_arch" "$app_path" >&2
  printf 'Build it with: npx electron-builder --mac dir --%s\n' "$build_arch" >&2
  exit 1
fi

exec open "$app_path"