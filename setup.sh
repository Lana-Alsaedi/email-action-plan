#!/usr/bin/env bash

set -Eeuo pipefail

# Run everything from the project root
cd "$(dirname "$0")"

echo ""
echo "================================"
echo "       InboxPilot Setup"
echo "================================"
echo ""

# Check required tools
for tool in python3 node npm; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "Error: $tool is not installed or not on PATH."
        echo "Install $tool and run ./setup.sh again."
        exit 1
    fi
done

# Check project files before installing anything
required_files=(
    "backend/requirements.txt"
    "backend/.env.example"
    "frontend/package.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "Error: Required file is missing: $file"
        echo "Make sure you have a complete copy of the repository."
        exit 1
    fi
done

echo "Python:   $(python3 --version)"
echo "Node.js:  $(node --version)"
echo "npm:      $(npm --version)"
echo ""

# Create the Python environment if needed
if [ ! -x "backend/venv/bin/python" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
backend/venv/bin/python -m pip install --upgrade pip
backend/venv/bin/python -m pip install -r backend/requirements.txt

# Prepare local configuration without overwriting existing secrets
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "Creating backend/.env from the example..."
    cp backend/.env.example backend/.env
else
    echo "Keeping existing backend/.env"
fi

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
npm --prefix frontend install

echo ""
echo "================================"
echo "       Setup Complete"
echo "================================"
echo ""
echo "Before starting the app, configure:"
echo ""
echo "1. backend/.env"
echo "   Add your Anthropic API key."
echo ""
echo "2. backend/credentials.json"
echo "   Download your Google OAuth client credentials."
echo ""
echo "3. backend/firebase-key.json"
echo "   Download your Firebase service-account key."
echo ""
echo "Google OAuth and Firebase must be configured in their"
echo "respective Google Cloud and Firebase projects."
echo ""
echo "When configuration is ready, start the app with:"
echo "  ./dev.sh"
echo ""
echo "To build the Chrome extension, run:"
echo "  cd frontend && npm run build:extension"
echo ""
echo "Keep all credentials and generated tokens out of Git."
