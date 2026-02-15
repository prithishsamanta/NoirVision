"""
NoirVision Backend API
Complete integration of TwelveLabs video analysis and Backboard AI credibility verification.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from typing import Optional

from app.config import get_settings
from app.models import WitnessClaim, CredibilityReport
from app.noirvision_analyzer import NoirVisionAnalyzer
from app.services.twelvelabs_client import run_analysis
from app.routers import videos

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NoirVision API",
    description="Forensic video analysis and credibility reporting for law enforcement",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include video analysis router (for TwelveLabs integration)
app.include_router(videos.router)

# Initialize NoirVision analyzer
try:
    noirvision = NoirVisionAnalyzer()
    logger.info("✅ NoirVision analyzer initialized with Backboard AI")
except Exception as e:
    logger.error(f"Failed to initialize NoirVision analyzer: {e}")
    noirvision = None


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "NoirVision API",
        "status": "operational",
        "message": "In the city of lies, trust the footage.",
        "version": "2.0.0",
        "features": {
            "twelvelabs": True,
            "backboard_ai": noirvision is not None,
            "end_to_end_analysis": noirvision is not None
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    settings = get_settings()
    return {
        "status": "healthy",
        "noirvision_configured": noirvision is not None,
        "twelvelabs_configured": bool(settings.twelvelabs_api_key) or settings.twelvelabs_mock,
        "twelvelabs_mock": settings.twelvelabs_mock
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
            source_type = "youtube" if "youtube.com" in video_url or "youtu.be" in video_url else "url"
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


@app.post("/analyze/from_evidence")
async def analyze_from_evidence(
    claim: str = Form(..., description="Witness claim"),
    video_id: str = Form(..., description="TwelveLabs video ID"),
    case_id: Optional[str] = Form(None)
):
    """
    Analyze a claim against already-processed TwelveLabs video.
    
    Use this if video was already indexed by TwelveLabs.
    
    Args:
        claim: Witness statement
        video_id: TwelveLabs video ID
        case_id: Optional case ID
        
    Returns:
        Credibility report
    """
    if not noirvision:
        raise HTTPException(
            status_code=500,
            detail="NoirVision analyzer not initialized."
        )
    
    try:
        # Fetch evidence from S3 or rebuild from TwelveLabs
        from app.services.twelvelabs_client import build_evidence_pack
        
        logger.info("Rebuilding evidence pack for video_id=%s", video_id)
        evidence = build_evidence_pack(
            video_id=video_id,
            source_type="existing",
            source_url=f"video_id:{video_id}"
        )
        
        # Analyze with Backboard
        report = await noirvision.analyze_video_with_claim(
            evidence=evidence,
            claim_text=claim,
            case_id=case_id
        )
        
        formatted_report = noirvision.generate_formatted_report(report)
        
        return {
            "report": report.model_dump(),
            "formatted_report": formatted_report
        }
    
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
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
