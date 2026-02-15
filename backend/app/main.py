"""
NoirVision Backend API
FastAPI server for forensic video analysis and credibility reporting.
"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env from backend/ so BACKBOARD_API_KEY etc. are set before BackboardAnalyzer is created
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"
if _ENV_FILE.exists():
    load_dotenv(_ENV_FILE)

from app.models import CredibilityReport
from app.backboard_agent import BackboardAnalyzer
from app.report_generator import ReportGenerator
from app.noirvision_analyzer import NoirVisionAnalyzer
from app.services.twelvelabs_client import run_analysis
from app.config import get_settings
from app.routers import users, videos

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup. S3 and TwelveLabs are only required when calling /api/videos/* (checked there)."""
    s = get_settings()
    cognito_ok = bool(s.cognito_user_pool_id and s.cognito_user_pool_id.strip())
    logger.info("NoirVision backend starting; Cognito configured=%s", cognito_ok)
    if not cognito_ok:
        logger.warning("Set COGNITO_USER_POOL_ID (and COGNITO_REGION) in backend/.env for /api/users/me/*")
    yield


app = FastAPI(
    title="NoirVision API",
    description="Forensic video analysis and credibility reporting for law enforcement",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzers (use Settings so BACKBOARD_API_KEY is read from same .env as Cognito)
try:
    settings = get_settings()
    api_key = (settings.backboard_api_key or "").strip() or os.getenv("BACKBOARD_API_KEY")
    if not api_key:
        raise ValueError("BACKBOARD_API_KEY not set in backend/.env or environment")
    analyzer = BackboardAnalyzer(api_key=api_key)
    noirvision = NoirVisionAnalyzer(backboard=analyzer)
    logger.info("✅ NoirVision analyzer initialized with Backboard AI")
except ValueError as e:
    logger.error("Failed to initialize: %s", e)
    analyzer = None
    noirvision = None

# Include routers
app.include_router(videos.router)
app.include_router(users.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "NoirVision API",
        "status": "operational",
        "message": "In the city of lies, trust the footage.",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint. ready_for_analysis = Backboard + (TwelveLabs or mock)."""
    s = get_settings()
    twelvelabs_ok = s.twelvelabs_mock or (
        bool((s.twelvelabs_api_key or "").strip()) and bool((s.twelvelabs_index_id or "").strip())
    )
    return {
        "status": "healthy",
        "backboard_configured": analyzer is not None,
        "twelvelabs_configured": twelvelabs_ok,
        "ready_for_analysis": analyzer is not None and twelvelabs_ok,
    }


@app.post("/analyze/complete")
async def analyze_complete(
    claim: str = Form(..., description="Witness claim/statement"),
    video_url: Optional[str] = Form(None, description="YouTube or public video URL"),
    video_file: Optional[UploadFile] = File(None, description="Video file upload"),
    case_id: Optional[str] = Form(None, description="Optional case ID")
):
    """
    Complete end-to-end analysis: Video → TwelveLabs → Backboard → Credibility Report.
    
    Provide EITHER video_url OR video_file (not both).
    
    Args:
        claim: Witness statement text
        video_url: YouTube URL or public video URL
        video_file: Uploaded video file
        case_id: Optional case identifier
        
    Returns:
        Complete credibility report with formatted ASCII output
    """
    if not noirvision:
        raise HTTPException(
            status_code=503,
            detail=(
                "NoirVision analyzer not initialized. Set BACKBOARD_API_KEY in backend/.env"
            ),
        )

    s = get_settings()
    if not s.twelvelabs_mock:
        if not (s.twelvelabs_api_key or "").strip():
            raise HTTPException(
                status_code=503,
                detail=(
                    "TwelveLabs not configured. Set TWELVELABS_API_KEY (or TWELVE_LABS_API_KEY) "
                    "in backend/.env, or set TWELVELABS_MOCK=true for demo."
                ),
            )
        if not (s.twelvelabs_index_id or "").strip():
            raise HTTPException(
                status_code=503,
                detail=(
                    "TwelveLabs index not set. Set TWELVELABS_INDEX_ID in backend/.env "
                    "(create an index at TwelveLabs first), or set TWELVELABS_MOCK=true for demo."
                ),
            )

    if not video_url and not video_file:
        raise HTTPException(
            status_code=400,
            detail="Provide either video_url or video_file"
        )
    
    if video_url and video_file:
        raise HTTPException(
            status_code=400,
            detail="Provide only one: video_url OR video_file, not both"
        )
    
    try:
        logger.info("Starting complete analysis for claim: %s...", claim[:50])
        
        # Step 1: Process video with TwelveLabs
        if video_file:
            # Save uploaded file temporarily
            safe_name = video_file.filename or "upload"
            temp_path = Path(f"/tmp/noirvision_{safe_name}")
            with open(temp_path, "wb") as f:
                f.write(await video_file.read())
            
            logger.info("Processing uploaded video: %s", safe_name)
            evidence = await asyncio.to_thread(
                run_analysis,
                video_file_path=str(temp_path),
                source_type="s3",
                source_url_for_pack=safe_name,
            )
            temp_path.unlink(missing_ok=True)
        else:
            logger.info("Processing video URL: %s", video_url)
            source_type = "youtube" if "youtube.com" in video_url or "youtu.be" in video_url else "youtube"
            evidence = await asyncio.to_thread(
                run_analysis,
                video_url=video_url,
                source_type=source_type,
                source_url_for_pack=video_url,
            )
        
        logger.info("✅ TwelveLabs analysis complete, video_id=%s", evidence.video_id)
        
        # Step 2: Analyze with Backboard AI
        logger.info("Starting Backboard AI credibility analysis...")
        report = await noirvision.analyze_video_with_claim(
            evidence=evidence,
            claim_text=claim,
            case_id=case_id
        )
        
        # Step 3: Generate formatted report
        formatted_report = noirvision.generate_formatted_report(report)
        
        logger.info("✅ Complete analysis done, case_id=%s, score=%d", 
                   report.case_id, report.credibility_score)
        
        return {
            "report": report.model_dump(),
            "formatted_report": formatted_report,
            "video_id": evidence.video_id
        }
    
    except Exception as e:
        import traceback
        logger.error("Analysis failed: %s: %s", type(e).__name__, str(e))
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {type(e).__name__}: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug
    )
