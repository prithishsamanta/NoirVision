# Docker Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- API keys ready (Backboard, TwelveLabs, AWS)

## 3-Step Setup

### 1. Configure Environment
```bash
cp env.example .env
# Edit .env with your API keys
```

### 2. Start Services
```bash
docker-compose up -d
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Check service status
docker-compose ps
```

## Using Makefile (Optional)

```bash
make install    # Copy env.example to .env
make build      # Build images
make up         # Start services
make logs       # View logs
make down       # Stop services
make health     # Check health
```

For detailed information, see [DOCKER.md](./DOCKER.md)
