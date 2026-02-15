#!/usr/bin/env python3
"""
Test script for NoirVision end-to-end integration.
Tests TwelveLabs mock → Backboard AI → Report generation.
"""
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.noirvision_analyzer import NoirVisionAnalyzer
from app.services.twelvelabs_client import run_analysis
from app.config import get_settings


async def test_complete_flow():
    """Test complete flow with TwelveLabs mock data."""
    print("=" * 70)
    print("NoirVision End-to-End Integration Test")
    print("=" * 70)
    
    # Configure for mock mode
    settings = get_settings()
    print(f"\n✓ TwelveLabs Mock Mode: {settings.twelvelabs_mock}")
    print(f"✓ Backboard API Key: {'*' * 20}{settings.twelvelabs_api_key[-10:] if hasattr(settings, 'twelvelabs_api_key') and settings.twelvelabs_api_key else 'Not Set'}")
    
    # Step 1: Get TwelveLabs analysis (mocked)
    print("\n" + "=" * 70)
    print("Step 1: Processing video with TwelveLabs...")
    print("=" * 70)
    
    test_url = "https://example.com/test-video.mp4"
    evidence = run_analysis(
        video_url=test_url,
        source_type="youtube",  # or "s3"
        source_url_for_pack=test_url
    )
    
    print(f"✓ Video ID: {evidence.video_id}")
    print(f"✓ Transcript length: {len(evidence.transcript)} chars")
    print(f"✓ Chapters: {len(evidence.chapters)}")
    print(f"✓ Events detected: {len(evidence.events)}")
    print(f"✓ Key quotes: {len(evidence.key_quotes)}")
    
    # Step 2: Analyze with Backboard
    print("\n" + "=" * 70)
    print("Step 2: Analyzing with Backboard AI...")
    print("=" * 70)
    
    test_claim = (
        "On Friday night around 11 PM, I was walking past the old "
        "warehouse on 5th Street when a tall man in a dark trench "
        "coat and fedora approached me, pulled out a knife, and "
        "demanded my wallet. I gave it to him and he ran away "
        "toward the river."
    )
    
    print(f"Claim: {test_claim[:80]}...")
    
    analyzer = NoirVisionAnalyzer()
    report = await analyzer.analyze_video_with_claim(
        evidence=evidence,
        claim_text=test_claim,
        case_id="TEST-001"
    )
    
    print(f"\n✓ Case ID: {report.case_id}")
    print(f"✓ Credibility Score: {report.credibility_score}/100")
    print(f"✓ Verdict: {report.verdict}")
    print(f"✓ Comparisons: {len(report.comparisons)}")
    
    # Step 3: Generate formatted report
    print("\n" + "=" * 70)
    print("Step 3: Generating formatted report...")
    print("=" * 70)
    
    formatted = analyzer.generate_formatted_report(report)
    
    print("\n" + formatted)
    
    print("\n" + "=" * 70)
    print("✅ Complete integration test PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_complete_flow())
