#!/usr/bin/env bash
# Auto-bump date-based version in manifest.json if unchanged from HEAD.
# Called by pre-commit hook — modifies manifest.json so the commit fails
# on first attempt; re-stage and commit again to proceed.
# [Created with AI: Claude Code with Opus 4.6]
set -euo pipefail

head_ver=$(git show HEAD:manifest.json 2>/dev/null | grep '"version"' | grep -oP '\d[\d.]*\d') || head_ver=""
curr_ver=$(grep '"version"' manifest.json | grep -oP '\d[\d.]*\d')

if [ "$head_ver" = "$curr_ver" ]; then
  # Chrome extension versions: 1-4 dot-separated integers (0-65535).
  # Non-zero integers must not start with 0, so strip leading zeros.
  new_ver="$(TZ=America/Los_Angeles date '+%Y.%-m.%-d.')$((10#$(TZ=America/Los_Angeles date '+%H%M')))"
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_ver\"/" manifest.json
  echo "Auto-bumped version to $new_ver — run: git add manifest.json && git commit"
fi
