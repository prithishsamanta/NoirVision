# Docker Troubleshooting Guide

## Issue: Backend Container Unhealthy

### Symptoms:
- `dependency failed to start: container noirvision-backend is unhealthy`
- Warnings about missing environment variables
- Frontend can't start because it depends on backend

### Root Causes:

1. **Missing .env file** - Docker Compose can't find environment variables
2. **Backend failing to start** - Without API keys, backend crashes
3. **Health check timing** - Backend needs time to initialize

### Solutions:

#### Step 1: Create .env File

```bash
# Copy the template
cp env.example .env

# Edit with your actual API keys
nano .env
```

**Required variables:**
- `BACKBOARD_API_KEY` - Required for backend to start
- `TWELVELABS_API_KEY` - Required for video processing
- `TWELVELABS_INDEX_ID` - Required for video indexing
- `AWS_ACCESS_KEY_ID` - For S3 storage
- `AWS_SECRET_ACCESS_KEY` - For S3 storage
- `S3_BUCKET` - S3 bucket name
- `COGNITO_USER_POOL_ID` - For authentication

#### Step 2: Verify .env File Location

The `.env` file must be in the **root directory** (same level as `docker-compose.yml`):

```
NoirVision/
├── .env                    ← Must be here
├── docker-compose.yml
├── backend/
└── frontend/
```

#### Step 3: Check Backend Logs

```bash
# View backend logs to see actual error
docker-compose logs backend

# Or follow logs in real-time
docker-compose logs -f backend
```

Common errors you might see:
- `ValueError: BACKBOARD_API_KEY not found in environment` - Missing API key
- `Failed to initialize` - Missing required configuration
- Connection errors - Network or service issues

#### Step 4: Test Backend Manually

```bash
# Start only backend (ignore frontend dependency)
docker-compose up backend

# In another terminal, check if it's responding
curl http://localhost:8000/health
```

#### Step 5: Adjust Health Check Timing

If backend takes longer to start, you can temporarily disable health check dependency:

Edit `docker-compose.yml`:
```yaml
frontend:
  depends_on:
    backend:
      condition: service_started  # Changed from service_healthy
```

Or increase start period in backend Dockerfile health check.

### Quick Fix Commands:

```bash
# 1. Create .env file
cp env.example .env
# Edit .env with your keys

# 2. Stop all containers
docker-compose down

# 3. Rebuild and start
docker-compose up -d --build

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f backend
```

### Testing Without Full Configuration:

If you want to test Docker setup without all API keys, you can use mock mode:

In `.env`:
```bash
TWELVELABS_MOCK=true
BACKBOARD_API_KEY=test-key  # Still required, but won't be validated
```

Note: This won't work for actual video analysis, but will let you test the Docker setup.

### Verify Environment Variables Are Loaded:

```bash
# Check if variables are being read
docker-compose config | grep -A 5 "BACKBOARD_API_KEY"

# Check inside container
docker-compose exec backend env | grep BACKBOARD
```

### Common Issues:

1. **.env file in wrong location** - Must be in root, not in backend/ or frontend/
2. **.env file has wrong format** - Must be `KEY=value` format, no spaces around `=`
3. **Missing required keys** - Backend requires BACKBOARD_API_KEY to start
4. **Health check too aggressive** - Backend needs 30-40 seconds to start
5. **Port conflicts** - Port 8000 or 3000 already in use

### Still Having Issues?

1. Check Docker is running: `docker ps`
2. Check disk space: `docker system df`
3. Clean up: `docker-compose down -v`
4. Rebuild from scratch: `docker-compose build --no-cache`
