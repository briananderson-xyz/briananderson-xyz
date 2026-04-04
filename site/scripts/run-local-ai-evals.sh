#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/functions"
FUNCTIONS_ENV_FILE="$FUNCTIONS_DIR/.env.local"
LOCAL_BASE_URL="${AI_EVAL_BASE_URL:-http://127.0.0.1:5173/api}"
EMULATOR_PID=""
VITE_PID=""
STARTED_EMULATOR=0
STARTED_VITE=0

cleanup() {
  if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
    kill "$VITE_PID" 2>/dev/null || true
  fi

  if [ -n "$EMULATOR_PID" ] && kill -0 "$EMULATOR_PID" 2>/dev/null; then
    kill "$EMULATOR_PID" 2>/dev/null || true
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
    if curl -sf "$url" >/dev/null 2>&1; then
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

  if curl -sf http://127.0.0.1:5001/ >/dev/null 2>&1; then
    echo "Firebase Functions emulator already running"
  else
    echo "Starting Firebase Functions emulator..."
    (
      cd "$FUNCTIONS_DIR"
      pnpm run serve >/tmp/brian-ai-evals-functions.log 2>&1
    ) &
    EMULATOR_PID=$!
    STARTED_EMULATOR=1
    wait_for_url "http://127.0.0.1:5001/" "Firebase Functions emulator"
  fi
}

show_started_logs() {
  if [ "$STARTED_VITE" -eq 1 ]; then
    echo "Vite log: /tmp/brian-ai-evals-vite.log"
  fi
  if [ "$STARTED_EMULATOR" -eq 1 ]; then
    echo "Functions log: /tmp/brian-ai-evals-functions.log"
  fi
}

main() {
  require_functions_env
  ensure_local_stack
  show_started_logs

  echo "Running AI evals against $LOCAL_BASE_URL"
  (
    cd "$ROOT_DIR"
    AI_EVAL_BASE_URL="$LOCAL_BASE_URL" \
    AI_EVAL_REPORT_PATH="artifacts/ai-evals-local.json" \
    node scripts/run-ai-evals.js ai-evals/chat.promptfoo.yaml ai-evals/fit-finder.promptfoo.yaml
  )
}

main "$@"
