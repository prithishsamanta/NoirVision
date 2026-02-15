#!/bin/bash
# Script to check backend container status and logs

echo "============================================="
echo "  Backend Container Diagnostics"
echo "============================================="
echo ""

echo "1. Checking container status..."
docker-compose ps backend
echo ""

echo "2. Checking backend logs (last 50 lines)..."
docker-compose logs --tail=50 backend
echo ""

echo "3. Checking if backend/.env exists..."
if [ -f "./backend/.env" ]; then
    echo "   ✓ backend/.env exists"
    echo "   Checking for required variables..."
    if grep -q "BACKBOARD_API_KEY" ./backend/.env; then
        echo "   ✓ BACKBOARD_API_KEY found"
    else
        echo "   ✗ BACKBOARD_API_KEY NOT FOUND"
    fi
else
    echo "   ✗ backend/.env does NOT exist"
fi
echo ""

echo "4. Testing backend health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✓ Backend is responding"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo "   ✗ Backend is NOT responding"
fi
echo ""

echo "5. Checking environment variables in container..."
docker-compose exec backend env | grep -E "(BACKBOARD|TWELVELABS|AWS)" | head -10 || echo "   Container not running or exec failed"
echo ""

echo "============================================="
echo "  Diagnostics Complete"
echo "============================================="
