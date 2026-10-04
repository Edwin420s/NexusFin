#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting NexusFin — Responsible Credit Decision Platform"
echo " ASEAN Financial Health Challenge — Problem Statement 3"
echo "=========================================================="

export PYTHONPATH="$DIR:$PYTHONPATH"

# Check if port 8000 is free or already running
echo "Launching FastAPI backend with Uvicorn..."
echo "Access the application at: http://127.0.0.1:8000"
echo "Interactive API docs at:    http://127.0.0.1:8000/docs"
echo "=========================================================="

python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
