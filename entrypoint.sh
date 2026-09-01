#!/bin/sh
set -e

TARGET_PATH="${1:-.}"
OUT_DIR="${2:-arch-lens-out}"

cd "${GITHUB_WORKSPACE:-/github/workspace}"

node /app/dist/cli/main-cli.js analyze "$TARGET_PATH" --out "$OUT_DIR" | tee /tmp/arch-lens-run.log

MODULE_COUNT=$(grep -oE 'Analyzed [0-9]+' /tmp/arch-lens-run.log | grep -oE '[0-9]+')
CYCLE_COUNT=$(grep -oE '[0-9]+ cycle' /tmp/arch-lens-run.log | grep -oE '[0-9]+')

if [ -n "$GITHUB_OUTPUT" ]; then
  {
    echo "module-count=${MODULE_COUNT}"
    echo "cycle-count=${CYCLE_COUNT}"
    echo "out-dir=${OUT_DIR}"
  } >> "$GITHUB_OUTPUT"
fi
