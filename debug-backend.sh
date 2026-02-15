#!/bin/bash
# Debug script for backend issues

echo "============================================="
echo "  Backend Debug Information"
echo "============================================="
echo ""

# Stop everything first
echo "1. Stopping all containers..."
docker-compose down
echo ""

# Check if .env file exists
echo "2. Checking backend/.env file..."
if [ -f "./backend/.env" ]; then
    echo "   ✓ backend/.env exists"
    echo ""
    echo "   First few lines (hiding sensitive values):"
    head -5 ./backend/.env | sed 's/=.*/=***HIDDEN***/'
    echo ""
else
    echo "   ✗ backend/.env does NOT exist"
    echo "   Please create it with your API keys"
    exit 1
fi

# Start backend only (without frontend dependency)
echo "3. Starting backend container (standalone)..."
docker-compose up -d backend
echo ""

# Wait a bit
echo "4. Waiting 10 seconds for backend to start..."
sleep 10
echo ""

# Check logs
echo "5. Backend logs:"
echo "----------------------------------------"
docker-compose logs backend
echo "----------------------------------------"
echo ""

# Check if it's running
echo "6. Container status:"
docker-compose ps backend
echo ""

# Try to access health endpoint
echo "7. Testing health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✓ Backend is healthy!"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo "   ✗ Backend is NOT responding"
    echo ""
    echo "   Common issues:"
    echo "   - Missing BACKBOARD_API_KEY in backend/.env"
    echo "   - Backend crashed on startup (check logs above)"
    echo "   - Port 8000 already in use"
fi
echo ""

echo "============================================="
echo "  Debug Complete"
echo "============================================="
echo ""
echo "To view logs in real-time: docker-compose logs -f backend"
echo "To stop: docker-compose down"
