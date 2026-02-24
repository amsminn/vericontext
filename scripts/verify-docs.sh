#!/usr/bin/env bash
#
# verify-docs.sh — Find all .md files containing VCC markers and verify them.
#
# Usage: bash scripts/verify-docs.sh
#
# Exits 0 if all files pass (or no marker files found), exits 1 if any fail.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Collect .md files that contain VCC markers, excluding node_modules, dist, .git.
# Read into array one file per line (handles spaces in filenames via IFS).
files=()
while IFS= read -r line; do
  files+=("$line")
done < <(
  grep -rl '\[\[vctx-' "$ROOT" \
    --include='*.md' \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
  | sort
)

if [ ${#files[@]} -eq 0 ]; then
  echo "No .md files with VCC markers found. Nothing to verify."
  exit 0
fi

echo "Found ${#files[@]} file(s) with VCC markers."
echo ""

fail_count=0

for filepath in "${files[@]}"; do
  # Convert absolute path to relative path from ROOT
  relpath="${filepath#"$ROOT"/}"

  if npx vcc verify workspace --root "$ROOT" --in-path "$relpath" --json > /dev/null 2>&1; then
    echo "  OK   $relpath"
  else
    echo "  FAIL $relpath"
    fail_count=$((fail_count + 1))
  fi
done

echo ""

if [ "$fail_count" -gt 0 ]; then
  echo "$fail_count file(s) failed verification."
  exit 1
else
  echo "All ${#files[@]} file(s) passed verification."
  exit 0
fi
