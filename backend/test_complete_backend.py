#!/usr/bin/env python3
"""
Complete NoirVision Backend Integration Test
Tests all components end-to-end with the sample video.
"""
import asyncio
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.noirvision_analyzer import NoirVisionAnalyzer
from app.services.twelvelabs_client import run_analysis
from app.config import get_settings


def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def print_section(text):
    """Print a section divider."""
    print("\n" + "-" * 70)
    print(f"  {text}")
    print("-" * 70)


async def test_complete_backend():
    """Run complete backend test suite."""
    start_time = time.time()
    
    print_header("NoirVision Complete Backend Integration Test")
    
    # Get configuration
    settings = get_settings()
    print(f"\n📋 Configuration:")
    print(f"   TwelveLabs Mock: {settings.twelvelabs_mock}")
    print(f"   TwelveLabs API: {'Configured' if settings.twelvelabs_api_key else 'Not configured'}")
    print(f"   Backboard API: {'Configured' if hasattr(settings, 'backboard_api_key') else 'Not configured'}")
    
    # Video path
    video_path = Path(__file__).parent / "video" / "sample.mp4"
    
    if not video_path.exists():
        print(f"\n❌ ERROR: Video file not found: {video_path}")
        return False
    
    print(f"\n✅ Video found: {video_path}")
    print(f"   Size: {video_path.stat().st_size / 1024:.1f} KB")
    
    # Test cases
    test_cases = [
        {
            "name": "Traffic Observation (Generic)",
            "claim": "Only cars moving on the road.",
            "case_id": "TEST-001",
        },
        {
            "name": "Detailed Traffic Claim",
            "claim": "Multiple vehicles including buses, trucks, and cars were observed passing through a busy intersection during daytime.",
            "case_id": "TEST-002",
        },
        {
            "name": "Contradictory Claim",
            "claim": "A robbery occurred at midnight with a suspect wearing all black and carrying a weapon.",
            "case_id": "TEST-003",
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print_header(f"Test Case {i}: {test_case['name']}")
        
        print(f"\n📝 Claim: {test_case['claim']}")
        print(f"🆔 Case ID: {test_case['case_id']}")
        
        try:
            # Step 1: TwelveLabs Analysis
            print_section("Step 1: TwelveLabs Video Analysis")
            
            if i == 1:  # Only process video once
                print("Processing video (this may take 30-60 seconds)...")
                evidence = run_analysis(
                    video_file_path=str(video_path),
                    source_type="s3",
                    source_url_for_pack=str(video_path)
                )
                
                print(f"\n✅ Video Analysis Complete:")
                print(f"   Video ID: {evidence.video_id}")
                print(f"   Duration: {len(evidence.transcript)} chars transcript")
                print(f"   Chapters: {len(evidence.chapters)}")
                print(f"   Events: {len(evidence.events)}")
                print(f"   Key Quotes: {len(evidence.key_quotes)}")
                
                if evidence.transcript:
                    print(f"\n   Transcript Preview:")
                    preview = evidence.transcript[:150].replace('\n', ' ')
                    print(f"   {preview}...")
            else:
                print("Using cached video analysis from Test Case 1...")
            
            # Step 2: Backboard AI Analysis
            print_section("Step 2: Backboard AI Credibility Analysis")
            
            analyzer = NoirVisionAnalyzer()
            report = await analyzer.analyze_video_with_claim(
                evidence=evidence,
                claim_text=test_case['claim'],
                case_id=test_case['case_id']
            )
            
            print(f"\n✅ Backboard Analysis Complete:")
            print(f"   Case Title: {report.case_title}")
            print(f"   Credibility Score: {report.credibility_score}/100")
            print(f"   Verdict: {report.verdict}")
            print(f"   Comparisons Made: {len(report.comparisons)}")
            
            # Show comparison breakdown
            print(f"\n   Comparison Breakdown:")
            matches = sum(1 for c in report.comparisons if c.match)
            print(f"   ✅ Matches: {matches}/{len(report.comparisons)}")
            print(f"   ❌ Mismatches: {len(report.comparisons) - matches}/{len(report.comparisons)}")
            
            # Step 3: Report Generation
            print_section("Step 3: Report Generation")
            
            formatted = analyzer.generate_formatted_report(report)
            print(f"\n✅ Report Generated ({len(formatted)} characters)")
            
            # Store results
            results.append({
                "test_case": test_case['name'],
                "case_id": test_case['case_id'],
                "score": report.credibility_score,
                "verdict": report.verdict,
                "success": True
            })
            
            print(f"\n✅ Test Case {i} PASSED")
            
        except Exception as e:
            print(f"\n❌ Test Case {i} FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
            results.append({
                "test_case": test_case['name'],
                "case_id": test_case['case_id'],
                "score": 0,
                "verdict": "ERROR",
                "success": False,
                "error": str(e)
            })
    
    # Summary
    print_header("Test Summary")
    
    elapsed_time = time.time() - start_time
    passed = sum(1 for r in results if r['success'])
    total = len(results)
    
    print(f"\n📊 Results:")
    print(f"   Total Tests: {total}")
    print(f"   Passed: {passed} ✅")
    print(f"   Failed: {total - passed} ❌")
    print(f"   Success Rate: {(passed/total)*100:.1f}%")
    print(f"   Total Time: {elapsed_time:.1f} seconds")
    
    print(f"\n📋 Individual Results:")
    for r in results:
        status = "✅ PASS" if r['success'] else "❌ FAIL"
        print(f"   {status} - {r['test_case']}")
        print(f"      Score: {r['score']}/100, Verdict: {r['verdict']}")
        if not r['success']:
            print(f"      Error: {r.get('error', 'Unknown')}")
    
    print_header("Test Complete")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(test_complete_backend())
    sys.exit(0 if success else 1)
