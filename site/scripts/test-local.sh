#!/bin/bash
#
# Local Testing Helper
# Runs Firebase emulators + SvelteKit dev server for local testing
#

set -e

echo "🚀 Starting local testing environment..."

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  WARNING: GEMINI_API_KEY not set!"
  echo "   Set it with: export GEMINI_API_KEY=your-key-here"
  echo "   Or create site/functions/.env.local with:"
  echo "   GEMINI_API_KEY=your-key-here"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Build content index first
echo "📦 Building content index..."
cd "$(dirname "$0")/.."
pnpm run build-content-index

# Start Firebase emulators in background
echo "🔥 Starting Firebase emulators..."
cd functions
pnpm run serve &
EMULATOR_PID=$!

# Wait for emulators to start
echo "⏳ Waiting for emulators to be ready..."
sleep 5

# Start SvelteKit dev server
echo "⚡ Starting SvelteKit dev server..."
cd ..
pnpm run dev &
VITE_PID=$!

echo ""
echo "✅ Local testing environment ready!"
echo ""
echo "📍 Services:"
echo "   - SvelteKit:          http://localhost:5173"
echo "   - Firebase Emulators: http://localhost:4000 (UI)"
echo "   - Functions:          http://localhost:5001"
echo ""
echo "🧪 Test the Fit Finder:"
echo "   1. Open http://localhost:5173"
echo "   2. Wait 30 seconds for connect banner"
echo "   3. Click '$ connect' → '$ check-fit'"
echo "   4. Paste a job description"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo '🛑 Stopping services...'; kill $EMULATOR_PID $VITE_PID 2>/dev/null; exit" INT
wait
