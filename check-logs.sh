#!/bin/bash
# Quick script to check backend logs

echo "============================================="
echo "  Backend Logs (Last 100 lines)"
echo "============================================="
echo ""

docker-compose logs --tail=100 backend

echo ""
echo "============================================="
echo ""
echo "If you see errors, common issues:"
echo "1. Missing BACKBOARD_API_KEY - check backend/.env"
echo "2. Import errors - check requirements.txt"
echo "3. Port already in use - check if port 8000 is free"
echo ""
echo "To follow logs in real-time:"
echo "  docker-compose logs -f backend"
