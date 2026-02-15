#!/bin/bash
# Script to fix port 3000 conflict

echo "============================================="
echo "  Port 3000 Conflict Resolution"
echo "============================================="
echo ""

echo "1. Checking what's using port 3000..."
if command -v lsof > /dev/null; then
    lsof -i :3000
    echo ""
    echo "To kill the process using port 3000:"
    echo "  lsof -ti :3000 | xargs kill -9"
    echo ""
else
    echo "  lsof not available. Checking with netstat..."
    netstat -an | grep 3000 || echo "  Could not check port status"
fi

echo ""
echo "2. Options to fix:"
echo ""
echo "   Option A: Kill the process using port 3000"
echo "   Option B: Change frontend port in docker-compose.yml"
echo ""
echo "   For Option B, edit docker-compose.yml and change:"
echo "   ports:"
echo "     - \"3001:80\"  # Changed from 3000:80"
echo ""
