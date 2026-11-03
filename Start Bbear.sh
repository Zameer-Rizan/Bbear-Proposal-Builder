#!/usr/bin/env bash
set -e
cd -- "$(dirname -- "$0")"

# Use the same private Supabase project as the deployed app. Keep credentials
# in the ignored local env file; never commit them or fall back silently to SQLite.
if [ ! -f .env.supabase-test ]; then
  echo "Missing .env.supabase-test. Add the local Supabase settings before starting the shared workspace."
  exit 1
fi
set -a
# shellcheck disable=SC1091
. ./.env.supabase-test
set +a
if [ "${STORAGE_MODE:-}" != "supabase" ]; then
  echo "Shared storage is not enabled in .env.supabase-test (STORAGE_MODE must be supabase)."
  exit 1
fi

if [ ! -d node_modules ]; then
  npm ci
fi
npm run dev -- --port "${PORT:-3001}"
