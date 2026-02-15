#!/bin/bash
# NoirVision Backend Server Startup Script
# This script ensures clean server startup and proper process management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================="
echo "   NoirVision Backend Server"
echo "============================================="
echo ""

# Change to backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo "Run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Using .env.example as template${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Please edit .env with your API keys"
    fi
fi

# Kill any existing server on port 8000
echo "Checking for existing server on port 8000..."
EXISTING_PID=$(lsof -ti:8000 2>/dev/null || echo "")
if [ ! -z "$EXISTING_PID" ]; then
    echo -e "${YELLOW}Stopping existing server (PID: $EXISTING_PID)${NC}"
    kill -9 $EXISTING_PID 2>/dev/null || true
    sleep 2
fi

# Start the server
echo -e "${GREEN}✅ Starting NoirVision server...${NC}"
echo ""
echo "Server will be available at: http://0.0.0.0:8000"
echo "Press Ctrl+C to stop"
echo ""

# Run uvicorn with proper settings
exec python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --log-level info
