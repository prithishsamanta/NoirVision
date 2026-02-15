# Docker Deployment Guide

This guide explains how to build and deploy NoirVision using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Environment variables configured (see `.env.example`)

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your API keys and configuration:
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Build and start services:**
   ```bash
   docker-compose up -d
   ```

4. **Check service status:**
   ```bash
   docker-compose ps
   ```

5. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Building Images

### Build all services:
```bash
docker-compose build
```

### Build specific service:
```bash
docker-compose build backend
docker-compose build frontend
```

### Build without cache:
```bash
docker-compose build --no-cache
```

## Environment Variables

All environment variables are defined in `.env.example`. Key variables:

- **BACKBOARD_API_KEY**: Required for AI analysis
- **TWELVELABS_API_KEY**: Required for video processing
- **TWELVELABS_INDEX_ID**: Required for video indexing
- **VITE_API_URL**: Frontend API endpoint (default: http://localhost:8000)
- **CORS_ORIGINS**: Allowed origins for CORS (comma-separated)

## Service Details

### Backend Service

- **Port**: 8000
- **Health Check**: http://localhost:8000/health
- **Database**: SQLite stored in `./backend/data/`
- **Logs**: Available via `docker-compose logs backend`

### Frontend Service

- **Port**: 3000 (mapped to nginx port 80)
- **Health Check**: http://localhost:3000/health
- **Build**: Multi-stage build with nginx for production
- **Logs**: Available via `docker-compose logs frontend`

## Development Mode

For local development with hot reload:

1. **Create override file:**
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

2. **Start services:**
   ```bash
   docker-compose up
   ```

The override file mounts source code as volumes and enables hot reload.

## Production Deployment

### 1. Update Environment Variables

Ensure all production values are set in `.env`:
- Set `ENVIRONMENT=production`
- Set `DEBUG=false`
- Configure production CORS origins
- Use production API keys

### 2. Build Production Images

```bash
docker-compose -f docker-compose.yml build
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Verify Deployment

```bash
# Check health
curl http://localhost:8000/health
curl http://localhost:3000/health

# Check logs
docker-compose logs --tail=50
```

## Troubleshooting

### Backend won't start

1. **Check logs:**
   ```bash
   docker-compose logs backend
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose exec backend env | grep -E "(BACKBOARD|TWELVELABS|AWS)"
   ```

3. **Check database permissions:**
   ```bash
   ls -la backend/data/
   ```

### Frontend can't connect to backend

1. **Check VITE_API_URL:**
   - In Docker: Use `http://backend:8000` for internal communication
   - External: Use `http://localhost:8000` or your domain

2. **Check CORS settings:**
   - Ensure frontend origin is in `CORS_ORIGINS`
   - Check backend logs for CORS errors

3. **Verify network:**
   ```bash
   docker-compose exec frontend ping backend
   ```

### Port conflicts

If ports 3000 or 8000 are already in use:

1. **Update docker-compose.yml:**
   ```yaml
   ports:
     - "3001:80"  # Frontend
     - "8001:8000"  # Backend
   ```

2. **Update VITE_API_URL** in `.env` to match new backend port

### Database issues

SQLite database is stored in `./backend/data/`. Ensure:
- Directory exists: `mkdir -p backend/data`
- Proper permissions: `chmod 755 backend/data`
- Volume is mounted correctly in docker-compose.yml

## Stopping Services

```bash
# Stop services (keeps containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and volumes
docker-compose down -v

# Stop, remove containers, volumes, and images
docker-compose down -v --rmi all
```

## Updating Services

1. **Pull latest code:**
   ```bash
   git pull
   ```

2. **Rebuild and restart:**
   ```bash
   docker-compose up -d --build
   ```

## Health Checks

Both services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:8000/health  # Backend
curl http://localhost:3000/health  # Frontend
```

## Security Considerations

1. **Never commit `.env` file** - it contains sensitive API keys
2. **Use secrets management** in production (AWS Secrets Manager, etc.)
3. **Keep images updated** - regularly rebuild with latest dependencies
4. **Use HTTPS** in production with reverse proxy (nginx, traefik)
5. **Limit CORS origins** to known domains only

## Scaling

To scale services (if needed):

```bash
# Scale backend (requires load balancer)
docker-compose up -d --scale backend=3

# Scale frontend (requires load balancer)
docker-compose up -d --scale frontend=2
```

Note: SQLite doesn't support multiple writers. For scaling backend, consider PostgreSQL.

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
