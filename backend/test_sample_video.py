#!/usr/bin/env python3
"""
Direct test of NoirVision with sample.mp4 video file.
"""
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.noirvision_analyzer import NoirVisionAnalyzer
from app.services.twelvelabs_client import run_analysis


async def test_sample_video():
    """Test with the sample.mp4 file."""
    print("=" * 70)
    print("NoirVision Test: Sample Video Analysis")
    print("=" * 70)
    
    # Video path
    video_path = Path(__file__).parent / "video" / "sample.mp4"
    
    if not video_path.exists():
        print(f"❌ Video file not found: {video_path}")
        return
    
    print(f"\n✓ Found video: {video_path}")
    print(f"✓ File size: {video_path.stat().st_size / 1024:.1f} KB")
    
    # Witness claim
    claim_text = "Only cars moving on the road."
    
    print(f"\n✓ Claim: {claim_text}")
    
    # Step 1: Process video with TwelveLabs
    print("\n" + "=" * 70)
    print("Step 1: Processing video with TwelveLabs...")
    print("=" * 70)
    
    try:
        evidence = run_analysis(
            video_file_path=str(video_path),
            source_type="s3",
            source_url_for_pack=str(video_path)
        )
        
        print(f"✓ Video ID: {evidence.video_id}")
        print(f"✓ Transcript length: {len(evidence.transcript)} chars")
        print(f"✓ Chapters: {len(evidence.chapters)}")
        print(f"✓ Events detected: {len(evidence.events)}")
        print(f"✓ Key quotes: {len(evidence.key_quotes)}")
        
        if evidence.transcript:
            print(f"\n📝 Transcript preview:")
            print(f"   {evidence.transcript[:200]}...")
        
    except Exception as e:
        print(f"❌ TwelveLabs processing failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 2: Analyze with Backboard AI
    print("\n" + "=" * 70)
    print("Step 2: Analyzing with Backboard AI...")
    print("=" * 70)
    
    try:
        analyzer = NoirVisionAnalyzer()
        report = await analyzer.analyze_video_with_claim(
            evidence=evidence,
            claim_text=claim_text,
            case_id="SAMPLE-001"
        )
        
        print(f"\n✓ Case ID: {report.case_id}")
        print(f"✓ Case Title: {report.case_title}")
        print(f"✓ Credibility Score: {report.credibility_score}/100")
        print(f"✓ Verdict: {report.verdict}")
        print(f"✓ Comparisons: {len(report.comparisons)}")
        
    except Exception as e:
        print(f"❌ Backboard analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 3: Generate formatted report
    print("\n" + "=" * 70)
    print("Step 3: Formatted Credibility Report")
    print("=" * 70)
    
    formatted = analyzer.generate_formatted_report(report)
    print("\n" + formatted)
    
    print("\n" + "=" * 70)
    print("✅ Complete analysis PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_sample_video())
