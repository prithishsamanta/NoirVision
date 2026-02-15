#!/bin/bash
# Script to help update docker-compose.yml with VITE_API_URL from frontend/.env

if [ -f "./frontend/.env" ]; then
    # Try to extract VITE_API_URL from frontend/.env
    VITE_API_URL=$(grep "^VITE_API_URL=" ./frontend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    
    if [ ! -z "$VITE_API_URL" ]; then
        echo "Found VITE_API_URL in frontend/.env: $VITE_API_URL"
        echo ""
        echo "To use this in Docker build, you can:"
        echo "1. Export it before building:"
        echo "   export VITE_API_URL=$VITE_API_URL"
        echo "   docker-compose build frontend"
        echo ""
        echo "2. Or set it in docker-compose.yml build args (already configured)"
    else
        echo "VITE_API_URL not found in frontend/.env"
    fi
else
    echo "frontend/.env file not found"
fi
