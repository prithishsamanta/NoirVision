#!/bin/bash
# NoirVision Docker Startup Script

set -e

echo "============================================="
echo "  NoirVision Docker Startup"
echo "============================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo ""
    echo "Creating .env from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "Created .env file from env.example"
        echo ""
        echo "IMPORTANT: Please edit .env file with your API keys:"
        echo "   - BACKBOARD_API_KEY"
        echo "   - TWELVELABS_API_KEY"
        echo "   - TWELVELABS_INDEX_ID"
        echo "   - AWS credentials"
        echo "   - Cognito settings"
        echo ""
        read -p "Press Enter after you've edited .env file, or Ctrl+C to exit..."
    else
        echo "ERROR: env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Create data directory
echo "Creating data directory..."
mkdir -p backend/data
echo "Data directory ready"
echo ""

# Build images
echo "Building Docker images..."
docker-compose build
echo "Images built"
echo ""

# Start services
echo "Starting services..."
docker-compose up -d
echo "Services started"
echo ""

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 5

# Check health
echo ""
echo "Checking service health..."
echo ""

# Backend health
echo "Backend health:"
if curl -s http://localhost:8000/health > /dev/null; then
    echo "  Backend is healthy"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo "  Backend not responding yet (may still be starting)"
fi

echo ""

# Frontend health
echo "Frontend health:"
if curl -s http://localhost:3000/health > /dev/null; then
    echo "  Frontend is healthy"
else
    echo "  Frontend not responding yet (may still be starting)"
fi

echo ""
echo "============================================="
echo "  Services are starting!"
echo "============================================="
echo ""
echo "Access points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Status:       docker-compose ps"
echo ""
echo "View logs with: docker-compose logs -f"
echo ""
