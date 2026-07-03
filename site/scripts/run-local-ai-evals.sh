#!/usr/bin/env bash

# Local AI-eval loop. Boots the real API server (the same Express app that runs
# on Cloud Run: `node lib/server.js`) plus the Vite dev server for the content
# index, then runs the eval suite against the local API. This lets you iterate
# on prompts / handlers / local content and see the eval result before pushing.
#
# History: this used to boot a Firebase Functions emulator. The backend migrated
# to Cloud Run (a plain Express server), so the emulator path was dead — the
# functions no longer export a Firebase handler and the firebase CLI isn't even
# a dependency. It now runs the Cloud Run entrypoint directly.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/functions"
FUNCTIONS_ENV_FILE="$FUNCTIONS_DIR/.env.local"
# The API server grounds the chat/fit-finder tools in ${SITE_URL}/content-index*.json.
# Point it at the local Vite server so the loop evaluates your *local* content.
SITE_ORIGIN="${AI_EVAL_SITE_ORIGIN:-http://127.0.0.1:5173}"
API_PORT="${AI_EVAL_API_PORT:-8080}"
LOCAL_BASE_URL="${AI_EVAL_BASE_URL:-http://127.0.0.1:${API_PORT}}"
VITE_PID=""
API_PID=""
STARTED_VITE=0
STARTED_API=0

cleanup() {
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi

  if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
    kill "$VITE_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

require_functions_env() {
  if [ ! -f "$FUNCTIONS_ENV_FILE" ]; then
    echo "Missing $FUNCTIONS_ENV_FILE"
    echo "Create it with:"
    echo "  GEMINI_API_KEY=your-key-here"
    exit 1
  fi

  if ! grep -Eq '^GEMINI_API_KEY=.+' "$FUNCTIONS_ENV_FILE"; then
    echo "$FUNCTIONS_ENV_FILE does not contain GEMINI_API_KEY"
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"

  for _ in $(seq 1 "$attempts"); do
    if curl -s -o /dev/null --connect-timeout 1 --max-time 2 "$url"; then
      echo "$label is ready at $url"
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for $label at $url"
  return 1
}

ensure_local_stack() {
  if curl -sf http://127.0.0.1:5173/ >/dev/null 2>&1; then
    echo "Vite dev server already running"
  else
    echo "Starting Vite dev server..."
    (
      cd "$ROOT_DIR"
      pnpm run build-content-index >/tmp/brian-ai-evals-build-content-index.log 2>&1
      pnpm run dev >/tmp/brian-ai-evals-vite.log 2>&1
    ) &
    VITE_PID=$!
    STARTED_VITE=1
    wait_for_url "http://127.0.0.1:5173/" "Vite dev server"
  fi

  if curl -sf "http://127.0.0.1:${API_PORT}/" >/dev/null 2>&1; then
    echo "API server already running on port ${API_PORT}"
  else
    echo "Starting API server (node lib/server.js) on port ${API_PORT}..."
    (
      cd "$FUNCTIONS_DIR"
      pnpm run build >/tmp/brian-ai-evals-functions-build.log 2>&1
      # API_RATE_LIMIT lifted so the whole suite firing from one host doesn't 429.
      # SITE_URL points at the local Vite server so tools ground in local content.
      PORT="$API_PORT" \
      SITE_URL="$SITE_ORIGIN" \
      API_RATE_LIMIT="1000" \
      node --env-file-if-exists=.env.local lib/server.js >/tmp/brian-ai-evals-api.log 2>&1
    ) &
    API_PID=$!
    STARTED_API=1
    wait_for_url "http://127.0.0.1:${API_PORT}/" "API server"
  fi
}

show_started_logs() {
  if [ "$STARTED_VITE" -eq 1 ]; then
    echo "Vite log: /tmp/brian-ai-evals-vite.log"
  fi
  if [ "$STARTED_API" -eq 1 ]; then
    echo "API log: /tmp/brian-ai-evals-api.log"
  fi
}

main() {
  require_functions_env
  ensure_local_stack
  show_started_logs

  echo "Running AI evals against $LOCAL_BASE_URL (content from $SITE_ORIGIN)"
  (
    cd "$ROOT_DIR"
    AI_EVAL_BASE_URL="$LOCAL_BASE_URL" \
    AI_EVAL_REPORT_PATH="artifacts/ai-evals-local.json" \
    node scripts/run-ai-evals.js ai-evals/chat.promptfoo.yaml ai-evals/fit-finder.promptfoo.yaml
  )
}

main "$@"
