# Docker Start Guide - Step by Step

## Step 1: Check Your Existing Environment Variables

First, let's check what environment variables you already have:

```bash
# Check backend .env file
cat backend/.env

# Check frontend .env file  
cat frontend/.env
```

## Step 2: Create Root .env File for Docker

Docker Compose reads from a `.env` file in the **root directory** (same level as `docker-compose.yml`).

### Option A: Copy from template and fill manually
```bash
# Copy the template
cp env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

### Option B: Create from existing .env files (if you have them)

If you have existing `.env` files in `backend/` and `frontend/`, you can extract the values:

```bash
# Create .env file in root
touch .env

# Add all variables from your existing files
# You'll need to manually copy the values from:
# - backend/.env (for backend variables)
# - frontend/.env (for VITE_API_URL)
```

## Step 3: Required Environment Variables

Here's what you need in your root `.env` file:

### **Required for Backend:**
- `BACKBOARD_API_KEY` - Your Backboard API key
- `TWELVELABS_API_KEY` - Your TwelveLabs API key  
- `TWELVELABS_INDEX_ID` - Your TwelveLabs index ID
- `S3_BUCKET` - Your S3 bucket name
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_REGION` - Cognito region (e.g., us-east-2)

### **Optional but Recommended:**
- `COGNITO_CLIENT_ID` - Cognito client ID
- `AWS_REGION` - AWS region (default: us-east-1)
- `VITE_API_URL` - Frontend API URL (default: http://localhost:8000)
- `CORS_ORIGINS` - Allowed CORS origins (default: http://localhost:3000,http://127.0.0.1:3000)

### **For Testing (can use mock mode):**
- `TWELVELABS_MOCK=true` - Use mock data instead of real API (for testing)

## Step 4: Create Data Directory

```bash
# Create directory for SQLite database
mkdir -p backend/data
```

## Step 5: Build Docker Images

```bash
# Build both backend and frontend images
docker-compose build

# Or build individually
docker-compose build backend
docker-compose build frontend
```

## Step 6: Start the Application

```bash
# Start in detached mode (runs in background)
docker-compose up -d

# Or start with logs visible
docker-compose up
```

## Step 7: Check if Services are Running

```bash
# Check container status
docker-compose ps

# You should see both services as "Up" and "healthy"
```

## Step 8: Test the Application

### Test Backend Health:
```bash
# Check backend health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","backboard_configured":true}
```

### Test Frontend:
```bash
# Check frontend health
curl http://localhost:3000/health

# Expected response:
# healthy
```

### Test in Browser:
- **Frontend**: Open http://localhost:3000 in your browser
- **Backend API Docs**: Open http://localhost:8000/docs in your browser

### Test Backend API:
```bash
# Test root endpoint
curl http://localhost:8000/

# Test API documentation
curl http://localhost:8000/docs
```

## Step 9: View Logs

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend

# View last 50 lines
docker-compose logs --tail=50
```

## Step 10: Verify Environment Variables

Check if environment variables are loaded correctly:

```bash
# Check backend environment
docker-compose exec backend env | grep -E "(BACKBOARD|TWELVELABS|AWS|COGNITO)"

# Check if backend can see the variables
docker-compose exec backend python -c "import os; print('BACKBOARD_API_KEY:', 'SET' if os.getenv('BACKBOARD_API_KEY') else 'NOT SET')"
```

## Troubleshooting

### If backend fails to start:

1. **Check logs:**
   ```bash
   docker-compose logs backend
   ```

2. **Common issues:**
   - Missing API keys → Check your `.env` file
   - Port 8000 already in use → Change port in `docker-compose.yml`
   - Database permission issues → Check `backend/data/` directory permissions

### If frontend can't connect to backend:

1. **Check VITE_API_URL:**
   ```bash
   # The frontend is built with VITE_API_URL at build time
   # If you change it, you need to rebuild:
   docker-compose build frontend
   docker-compose up -d frontend
   ```

2. **Check CORS:**
   - Ensure `CORS_ORIGINS` in `.env` includes `http://localhost:3000`
   - Restart backend after changing CORS: `docker-compose restart backend`

### If you need to rebuild after code changes:

```bash
# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## Quick Reference Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Rebuild after code changes
docker-compose up -d --build

# Access backend shell
docker-compose exec backend /bin/bash

# Access frontend shell
docker-compose exec frontend /bin/sh

# Remove everything (containers, volumes, networks)
docker-compose down -v
```

## Environment Variable Mapping

Here's how your existing `.env` files map to Docker:

| Old Location | Docker .env Variable | Notes |
|-------------|---------------------|-------|
| `backend/.env` → `BACKBOARD_API_KEY` | `BACKBOARD_API_KEY` | Same name |
| `backend/.env` → `TWELVELABS_API_KEY` | `TWELVELABS_API_KEY` | Same name |
| `backend/.env` → `TWELVELABS_INDEX_ID` | `TWELVELABS_INDEX_ID` | Same name |
| `backend/.env` → `AWS_*` | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, etc. | Same names |
| `backend/.env` → `COGNITO_*` | `COGNITO_USER_POOL_ID`, `COGNITO_REGION`, etc. | Same names |
| `frontend/.env` → `VITE_API_URL` | `VITE_API_URL` | Same name, but used at build time |

**Important**: All environment variables for Docker must be in the **root `.env` file**, not in `backend/.env` or `frontend/.env`.
