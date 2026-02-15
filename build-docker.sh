#!/bin/bash
# Build script that loads VITE_API_URL from frontend/.env

set -e

echo "Loading environment variables from .env files..."

# Load VITE_API_URL from frontend/.env if it exists
if [ -f "./frontend/.env" ]; then
    # Source the frontend .env file to get VITE_API_URL
    export $(grep -v '^#' ./frontend/.env | grep VITE_API_URL | xargs)
    echo "Loaded VITE_API_URL from frontend/.env: ${VITE_API_URL:-not set}"
fi

# Use default if not set
export VITE_API_URL=${VITE_API_URL:-http://localhost:8000}

echo "Building Docker images with VITE_API_URL=$VITE_API_URL"
echo ""

# Build with the environment variable
docker-compose build

echo ""
echo "Build complete! Start services with: docker-compose up -d"
