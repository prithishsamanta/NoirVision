#!/usr/bin/env python3
"""
Simple backend test - verifies all components work
"""
import asyncio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from app.noirvision_analyzer import NoirVisionAnalyzer
from app.services.twelvelabs_client import run_analysis

async def test():
    print("Testing NoirVision Backend...")
    print()
    
    # Test video path
    video_path = Path("video/sample.mp4")
    if not video_path.exists():
        print(f"Video not found: {video_path}")
        return False
    
    print(f"Video found: {video_path}")
    
    # Test claim
    claim = "Multiple vehicles including buses and trucks passing through a busy intersection."
    
    print(f"Claim: {claim[:70]}...")
    print()
    print("Step 1: TwelveLabs processing...")
    
    # Process video
    evidence = run_analysis(
        video_file_path=str(video_path),
        source_type="s3",
        source_url_for_pack=str(video_path)
    )
    
    print(f"Video processed: {evidence.video_id}")
    print(f"   Events: {len(evidence.events)}, Chapters: {len(evidence.chapters)}")
    print()
    print("Step 2: Backboard AI analysis...")
    
    # Analyze
    analyzer = NoirVisionAnalyzer()
    report = await analyzer.analyze_video_with_claim(
        evidence=evidence,
        claim_text=claim,
        case_id="SIMPLE-TEST"
    )
    
    print(f"Analysis complete!")
    print(f"   Score: {report.credibility_score}/100")
    print(f"   Verdict: {report.verdict}")
    print()
    print("ALL TESTS PASSED!")
    return True

if __name__ == "__main__":
    success = asyncio.run(test())
    exit(0 if success else 1)
