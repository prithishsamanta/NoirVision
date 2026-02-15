"""
NoirVision Backend API
FastAPI server for forensic video analysis and credibility reporting.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path
from typing import Optional

from app.models import WitnessClaim, CredibilityReport
from app.backboard_agent import BackboardAnalyzer
from app.report_generator import ReportGenerator
from app.noirvision_analyzer import NoirVisionAnalyzer
from app.services.twelvelabs_client import run_analysis
# Temporarily commented out - not needed for core analysis
# from app.mock_data import (
#     get_mock_video_analysis_supported,
#     get_mock_video_analysis_contradicted,
#     MOCK_CLAIM_SUPPORTED,
#     MOCK_CLAIM_CONTRADICTED
# )
from app.config import get_settings
# from app.routers import users, videos  # Temporarily disabled

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup. S3 and TwelveLabs are only required when calling /api/videos/* (checked there)."""
    s = get_settings()
    cognito_ok = bool(s.cognito_user_pool_id and s.cognito_user_pool_id.strip())
    logger.info("NoirVision backend starting; Cognito configured=%s", cognito_ok)
    if not cognito_ok:
        logger.warning("Set COGNITO_USER_POOL_ID (and COGNITO_REGION) in backend/.env for /api/users/me/*")
    yield


# TODO(production): Add auth dependency (e.g. JWT or API key) and use on protected routes.
# Demo mode: no auth; all routes are open.

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

# Initialize analyzers
try:
    analyzer = BackboardAnalyzer()
    noirvision = NoirVisionAnalyzer()
    logger.info("✅ NoirVision analyzer initialized with Backboard AI")
except ValueError as e:
    logger.error(f"Failed to initialize: {e}")
    analyzer = None
    noirvision = None

# Include routers (temporarily disabled for core functionality)
# app.include_router(videos.router)
# app.include_router(users.router)


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
    """Health check endpoint."""
    return {
        "status": "healthy",
        "backboard_configured": analyzer is not None
    }


@app.post("/analyze", response_model=dict)
async def analyze_claim(request: AnalysisRequest):
    """
    Analyze a witness claim against video evidence.
    
    Args:
        request: AnalysisRequest containing claim and video analysis
        
    Returns:
        Dictionary with credibility report (both structured and formatted)
    """
    if not analyzer:
        raise HTTPException(
            status_code=500,
            detail="Backboard analyzer not configured. Set BACKBOARD_API_KEY in environment."
        )
    
    try:
        # Run analysis
        report = await analyzer.analyze_claim_vs_video(
            claim=request.claim,
            video_analysis=request.video_analysis
        )
        
        # Generate formatted report
        formatted_report = ReportGenerator.generate_report(report)
        
        return {
            "report": report.model_dump(),
            "formatted_report": formatted_report
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/analyze/text", response_model=dict)
async def analyze_text_only(claim_text: str):
    """
    Quick analysis endpoint - just provide claim text, uses mock video.
    Useful for testing.
    
    Args:
        claim_text: The witness claim text
        
    Returns:
        Dictionary with credibility report
    """
    if not analyzer:
        raise HTTPException(
            status_code=500,
            detail="Backboard analyzer not configured. Set BACKBOARD_API_KEY in environment."
        )
    
    try:
        # Determine which mock video to use based on claim
        from app.mock_data import get_mock_video_analysis_supported, get_mock_video_analysis_contradicted
        if "blue note" in claim_text.lower() or "jazz club" in claim_text.lower():
            video_analysis = get_mock_video_analysis_contradicted()
        else:
            video_analysis = get_mock_video_analysis_supported()
        
        # Create claim object
        claim = WitnessClaim(claim_text=claim_text)
        
        # Run analysis
        report = await analyzer.analyze_claim_vs_video(
            claim=claim,
            video_analysis=video_analysis
        )
        
        # Generate formatted report
        formatted_report = ReportGenerator.generate_report(report)
        
        return {
            "report": report.model_dump(),
            "formatted_report": formatted_report
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


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
            status_code=500,
            detail="NoirVision analyzer not initialized. Check BACKBOARD_API_KEY."
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
            temp_path = Path(f"/tmp/noirvision_{video_file.filename}")
            with open(temp_path, "wb") as f:
                f.write(await video_file.read())
            
            logger.info("Processing uploaded video: %s", video_file.filename)
            evidence = run_analysis(
                video_file_path=str(temp_path),
                source_type="s3",
                source_url_for_pack=video_file.filename
            )
            
            # Cleanup
            temp_path.unlink(missing_ok=True)
        else:
            logger.info("Processing video URL: %s", video_url)
            source_type = "youtube" if "youtube.com" in video_url or "youtu.be" in video_url else "youtube"
            evidence = run_analysis(
                video_url=video_url,
                source_type=source_type,
                source_url_for_pack=video_url
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
        logger.error(f"Analysis failed: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
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
