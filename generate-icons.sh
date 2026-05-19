#!/usr/bin/env bash
# generate-icons.sh
# Delegates to scripts/generate-icons.ts (uses the `sharp` npm package).
# Run AFTER `bun install` so that sharp is available.
set -e
bun run icons
