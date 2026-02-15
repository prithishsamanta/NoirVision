# NoirVision - Forensic Video Analysis System

**Forensic video analysis and credibility reporting for law enforcement**

---

## Overview

NoirVision is a complete video analysis platform that combines:
- **TwelveLabs** for intelligent video processing
- **Backboard AI** for credibility analysis
- **AWS Cognito** for authentication
- **DynamoDB** for user data storage

---

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- AWS Account (for Cognito, DynamoDB)
- TwelveLabs API Key
- Backboard.io API Key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with backend URL

# Start dev server
npm run dev
```

### Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Documentation

- [DOCKER.md](DOCKER.md) – Docker setup and usage
- [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) – Quick Docker start
- [DOCKER_START_GUIDE.md](DOCKER_START_GUIDE.md) – Detailed Docker guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) – Common issues and fixes

---

## Architecture

### Backend (FastAPI)

**Core Endpoints:**
- `POST /analyze/complete` - Complete video analysis workflow
- `GET /health` - Health check

**Authenticated Endpoints** (require Bearer token):
- `GET /api/users/me/profile` - User profile
- `POST /api/users/me/incidents` - Create incident
- `GET /api/users/me/incidents` - List incidents
- `POST /api/videos/analyze` - Video analysis job
- `GET /api/videos/analyze/{job_id}` - Job status

### Frontend (React + Vite)

**Pages:**
- `/login` - Authentication via AWS Cognito
- `/signup` - User registration
- `/workspace` - Main analysis interface

**Key Features:**
- Video file upload (drag-and-drop)
- Real-time analysis progress
- Credibility score visualization
- ASCII art report display
- Case management

---

## Analysis Flow

```
User uploads video + claim
  ↓
TwelveLabs processes video (30-40s)
  ↓ Extract: events, objects, speech, text
Backboard AI analyzes credibility (15-20s)
  ↓ Compare claim vs evidence
Generate credibility report
  ↓ Score, verdict, comparisons
Display results to user
```

---

## Database Architecture

### DynamoDB - User Data
- **Table:** `noirvision_users`
- **Schema:** PK=user_id (Cognito sub), SK=PROFILE|INCIDENT#id
- **Stores:** User profiles and incident records

---

## Authentication

**Flow:**
1. User logs in via Cognito Hosted UI
2. Receives `id_token` (JWT)
3. Frontend sends token in `Authorization: Bearer` header
4. Backend validates JWT with Cognito JWKS
5. Extracts user info (`sub`, `email`)
6. Accesses user-specific data

---

## Environment Variables

### Backend (.env)

```bash
# Core APIs
BACKBOARD_API_KEY=your_key_here
TWELVELABS_API_KEY=your_key_here
TWELVELABS_INDEX_ID=your_index_id

# AWS Configuration
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-2
S3_BUCKET=your-bucket-name

# Cognito
COGNITO_USER_POOL_ID=us-east-2_xxxxxxx
COGNITO_REGION=us-east-2

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

---

## Testing

### Test Video Analysis

```bash
cd backend
source venv/bin/activate

# Test with sample video
python test_simple.py
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Complete analysis (with video file)
curl -X POST http://localhost:8000/analyze/complete \
  -F "claim=Multiple vehicles moving on the road" \
  -F "video_file=@video/sample.mp4" \
  -F "case_id=TEST-001"
```

---

## API Documentation

### POST /analyze/complete

**Complete video analysis workflow**

**Request:**
- `claim` (form): Witness statement text
- `video_file` (file): Video file OR
- `case_id` (form, optional): Case identifier

**Response:**
```json
{
  "report": {
    "case_id": "TEST-001",
    "case_title": "...",
    "witness_claim": "...",
    "credibility_score": 80,
    "verdict": "CLAIM SUPPORTED",
    "comparisons": [...],
    "recommendation": "...",
    "evidence_summary": [...],
    "detective_note": "..."
  },
  "formatted_report": "ASCII art report...",
  "video_id": "twelvelabs_video_id"
}
```

---

## Project Structure

```
NoirVision/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app
│   │   ├── auth.py                 # JWT validation
│   │   ├── config.py               # Configuration
│   │   ├── db.py                   # SQLite database
│   │   ├── models.py               # Data models
│   │   ├── noirvision_analyzer.py  # Main orchestrator
│   │   ├── backboard_agent.py      # Backboard AI integration
│   │   ├── report_generator.py     # Report formatting
│   │   ├── models_twelvelabs/      # TwelveLabs models
│   │   ├── routers/                # API routes
│   │   │   ├── users.py            # User endpoints
│   │   │   └── videos.py           # Video endpoints
│   │   └── services/               # External services
│   │       ├── twelvelabs_client.py
│   │       ├── dynamodb_users.py
│   │       └── s3_store.py
│   ├── requirements.txt
│   ├── .env.example
│   └── video/                      # Test videos
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── analysis.js         # Analysis API client
│   │   │   └── users.js            # User API client
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   │   └── Workspace.jsx
│   │   ├── components/             # React components
│   │   ├── authConfig.js           # Cognito config
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Performance

**Typical Analysis Time:**
- Video processing (TwelveLabs): 30-40 seconds
- Credibility analysis (Backboard): 15-20 seconds
- **Total:** ~55-60 seconds per analysis

---

## Deployment

### Backend

**Recommended:** AWS Elastic Beanstalk, Render, or Railway

```bash
# Build
cd backend
pip install -r requirements.txt

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

**Recommended:** Vercel or Netlify

```bash
cd frontend
npm run build
# Deploy dist/ folder
```

**Update environment:**
- Set `VITE_API_URL` to production backend URL
- Update CORS in backend to allow production domain

---

## Troubleshooting

### Backend won't start

**Check:**
1. Environment variables set in `.env`
2. Virtual environment activated
3. Dependencies installed: `pip install -r requirements.txt`
4. Port 8000 not in use: `lsof -ti:8000`

### Frontend can't connect to backend

**Check:**
1. `VITE_API_URL` in `frontend/.env`
2. Backend CORS allows frontend origin
3. Backend server running on correct port

### Authentication fails

**Check:**
1. `COGNITO_USER_POOL_ID` and `COGNITO_REGION` set
2. `authConfig.js` has correct authority and client_id
3. Cognito User Pool is active
4. User exists in Cognito

### DynamoDB access denied

**Check:**
1. IAM user has DynamoDB permissions
2. Table `noirvision_users` exists
3. AWS credentials in `.env` are correct

---

## Documentation

- **Architecture:** `backend/ARCHITECTURE.md`
- **API Integration:** `INTEGRATION_GUIDE.md`
- **Auth & Database:** `AUTH_DATABASE_TEST_REPORT.md`
- **Frontend:** `FRONTEND_INTEGRATION_COMPLETE.md`

---

## License

MIT License

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation files
3. Check backend logs: `/tmp/noirvision_backend.log`
4. Check frontend console for errors

---

**Built with TwelveLabs, Backboard.io, FastAPI, and React**

*"In the city of lies, trust the footage."*
