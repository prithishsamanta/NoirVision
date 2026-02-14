# NoirVision Backend

TwelveLabs video analysis pipeline: submit a YouTube URL or S3 video, get a structured **Evidence Pack** (transcript, chapters, key moments, quotes) for downstream claim scoring and RAG.

## How to run

1. **Create a virtualenv and install dependencies**

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```

2. **Set required environment variables** (see below).

3. **Start the server**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   - API: http://localhost:8000  
   - Docs: http://localhost:8000/docs  

## Required environment variables

Configure via `.env` in the project root or in `backend/`, or export in the shell.

| Variable | Required | Description |
|----------|----------|-------------|
| `TWELVELABS_API_KEY` | Yes* | TwelveLabs API key (header `x-api-key`). Also accepts `TWELVE_LABS_API_KEY`. |
| `TWELVELABS_INDEX_ID` | Yes* | Index ID from TwelveLabs (create an index in the dashboard; needed for video indexing). |
| `TWELVELABS_MOCK` | No | Set to `true` to skip real API and return a deterministic demo Evidence Pack (no key/index needed). |
| `S3_BUCKET` | Yes | S3 bucket for evidence JSON and (optionally) job artifacts. |
| `AWS_REGION` | No | Default `us-east-1`. |
| `AWS_ACCESS_KEY_ID` | No | Omit if using instance role / default profile. |
| `AWS_SECRET_ACCESS_KEY` | No | Omit if using instance role / default profile. |

\* Not required when `TWELVELABS_MOCK=true`.

**Startup validation:** Missing required vars produce a clear error on startup (e.g. `Missing required env: S3_BUCKET`).

## Example: YouTube URL flow

**1. Submit analysis**

```bash
curl -X POST http://localhost:8000/api/videos/analyze \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"proj-1\", \"claim\": \"The speaker argues that X.\", \"youtube_url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"
```

Example response:

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Analysis started. Poll GET /api/videos/analyze/{job_id} for status."
}
```

**2. Poll job status**

```bash
curl http://localhost:8000/api/videos/analyze/550e8400-e29b-41d4-a716-446655440000
```

Example when done:

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done",
  "video_id": "tl-video-id-here",
  "error": null
}
```

**3. Fetch Evidence Pack**

```bash
curl "http://localhost:8000/api/videos/tl-video-id-here/evidence?project_id=proj-1"
```

Optional: omit `project_id` if only one job has that `video_id`.

---

## Example: S3 flow

**1. Submit analysis (video already in S3)**

```bash
curl -X POST http://localhost:8000/api/videos/analyze \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"proj-1\", \"claim\": \"The video shows Y.\", \"s3_key\": \"uploads/my-video.mp4\"}"
```

**2. Poll and fetch evidence** — same as YouTube: poll `GET /api/videos/analyze/{job_id}`, then `GET /api/videos/{video_id}/evidence`.

---

## Evidence Pack contract

Downstream services (Backboard claim scoring, RAG) consume the Evidence Pack JSON. Shape (Pydantic model):

- `video_id` (string)
- `source`: `{ "type": "youtube" | "s3", "url": string }`
- `transcript` (string)
- `chapters`: `[{ "start": float, "end": float, "summary": string }]`
- `events`: `[{ "t": float, "type": "action"|"object"|"speech"|"scene", "label": string, "evidence": string }]`
- `key_quotes`: `[{ "t": float, "text": string }]`
- `created_at`, `model_provider`: `"twelvelabs"`
- `raw_twelvelabs` (optional): raw provider response when available

Evidence is stored in S3 at:

`projects/{project_id}/videos/{video_id}/evidence.json`

---

## Mock mode (no TwelveLabs key)

For local/demo without an API key:

```bash
set TWELVELABS_MOCK=true
set S3_BUCKET=your-bucket
set AWS_REGION=us-east-1
# AWS credentials if not using profile
uvicorn app.main:app --reload --port 8000
```

Submit and poll as above; the backend returns a deterministic Evidence Pack and does not call TwelveLabs.

---

## Auth (demo)

There is no auth on the API by default. For production, add a dependency that validates a JWT or API key (TODO in code).

---

## Project layout

- `app/config.py` — Pydantic Settings, env validation  
- `app/models/` — Evidence Pack and job request/response models  
- `app/db.py` — SQLite job storage (SQLModel)  
- `app/services/s3_store.py` — S3 put_json / get_json / presigned URL  
- `app/services/twelvelabs_client.py` — TwelveLabs create task, poll, summarize, mock  
- `app/routers/videos.py` — POST /analyze, GET /analyze/{job_id}, GET /{video_id}/evidence  
- `app/main.py` — FastAPI app, CORS, startup validation  
