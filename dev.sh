#!/usr/bin/env bash

set -Eeuo pipefail

# Run everything from the project root
cd "$(dirname "$0")"

BACKEND_PID=""
FRONTEND_PID=""

# Stop both servers when the script exits
cleanup() {
    trap - EXIT INT TERM

    echo ""
    echo "Stopping InboxPilot..."

    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
        if [ -n "$pid" ]; then
            wait "$pid" 2>/dev/null || true
        fi
    done
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Check that setup has been completed
if [ ! -x "backend/venv/bin/uvicorn" ] || [ ! -d "frontend/node_modules" ]; then
    echo "Dependencies are missing. Run ./setup.sh first."
    exit 1
fi

# Check required configuration files
missing=0

if [ ! -f "backend/.env" ]; then
    echo "Missing backend/.env. Run ./setup.sh first."
    missing=1
else
    # Read the key without displaying its value
    api_key=$(sed -n 's/^ANTHROPIC_API_KEY=//p' backend/.env | head -n 1)
    api_key="${api_key%\"}"
    api_key="${api_key#\"}"
    api_key="${api_key%\'}"
    api_key="${api_key#\'}"

    if [ -z "$api_key" ] || [ "$api_key" = "your_anthropic_api_key_here" ]; then
        echo "Add your Anthropic API key to backend/.env."
        missing=1
    fi
fi

if [ ! -f "backend/credentials.json" ]; then
    echo "Missing backend/credentials.json. Configure Google OAuth first."
    missing=1
fi

if [ ! -f "backend/firebase-key.json" ]; then
    echo "Missing backend/firebase-key.json. Configure Firebase first."
    missing=1
fi

if [ "$missing" -eq 1 ]; then
    echo ""
    echo "Complete the configuration steps in README.md, then run ./dev.sh again."
    exit 1
fi

# Start the backend from its expected working directory
echo "Starting backend..."
(
    cd backend
    exec venv/bin/uvicorn main:app --reload
) &
BACKEND_PID=$!

# Start the frontend
echo "Starting frontend..."
(
    cd frontend
    exec npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "InboxPilot is starting."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://127.0.0.1:8000"
echo "Press Control + C to stop both servers."
echo ""

# Stop the app if either server exits
while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "The backend stopped."
        exit 1
    fi

    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "The frontend stopped."
        exit 1
    fi

    sleep 1
done