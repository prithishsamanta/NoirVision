"""
Test real TwelveLabs API with detailed error reporting.
This script removes all mock fallbacks and provides clear diagnostics.
"""
import os
import sys
from pathlib import Path

# Setup paths and load env
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR.parent / ".env")

# Validate configuration
def validate_config():
    key = os.environ.get("TWELVELABS_API_KEY") or os.environ.get("TWELVE_LABS_API_KEY")
    index_id = os.environ.get("TWELVELABS_INDEX_ID")
    mock = os.environ.get("TWELVELABS_MOCK", "").lower() in ("true", "1", "yes")
    
    print("=" * 70)
    print("CONFIGURATION CHECK")
    print("=" * 70)
    print(f"TWELVELABS_API_KEY: {'[OK] Set' if key else '[ERROR] Missing'}")
    print(f"TWELVELABS_INDEX_ID: {index_id if index_id else '[ERROR] Missing'}")
    print(f"TWELVELABS_MOCK: {mock}")
    print()
    
    if mock:
        print("ERROR: TWELVELABS_MOCK is set to true. Set it to false or remove it.")
        return False
    if not key:
        print("ERROR: TWELVELABS_API_KEY not found in environment.")
        print("Add it to .env as: TWELVELABS_API_KEY=your_key")
        return False
    if not index_id:
        print("ERROR: TWELVELABS_INDEX_ID not found.")
        print("Create an index at https://playground.twelvelabs.io and add to .env")
        return False
    
    print("[OK] Configuration valid")
    return True

# Test video file
def check_video_file():
    mp4_path = BACKEND_DIR / "test_fixtures" / "sample.mp4"
    print("\n" + "=" * 70)
    print("VIDEO FILE CHECK")
    print("=" * 70)
    
    if not mp4_path.exists():
        print(f"[ERROR] File not found: {mp4_path}")
        return None
    
    size_mb = mp4_path.stat().st_size / (1024 * 1024)
    print(f"File: {mp4_path.name}")
    print(f"Size: {size_mb:.2f} MB")
    
    # Check resolution using ffprobe if available
    try:
        import subprocess
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0",
             str(mp4_path)],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            resolution = result.stdout.strip()
            width, height = map(int, resolution.split('x'))
            print(f"Resolution: {width}x{height}")
            
            if width < 360 or height < 360:
                print(f"[ERROR] Resolution too low: {width}x{height}")
                print("TwelveLabs requires min 360x360 (360p)")
                print("\nSOLUTION: Re-encode your video to at least 360p:")
                print(f"  ffmpeg -i {mp4_path.name} -vf scale=640:480 sample_360p.mp4")
                return None
            elif width > 5184 or height > 2160:
                print(f"[WARNING] Resolution very high: {width}x{height}")
                print("TwelveLabs max is 5184x2160 (2160p)")
            else:
                print(f"[OK] Resolution acceptable")
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("[WARNING] ffprobe not found, skipping resolution check")
    except Exception as e:
        print(f"[WARNING] Could not check resolution: {e}")
    
    if size_mb > 2000:
        print(f"[WARNING] File is {size_mb:.0f} MB. TwelveLabs direct upload limit is 2 GB.")
        print("  Large files may need multipart upload or external hosting.")
    elif size_mb > 500:
        print(f"[WARNING] File is {size_mb:.0f} MB. Upload may take several minutes.")
    else:
        print("[OK] File size acceptable")
    
    return mp4_path

# Test TwelveLabs API connection
def test_api_connection():
    print("\n" + "=" * 70)
    print("API CONNECTION TEST")
    print("=" * 70)
    
    from app.config import get_settings
    import httpx
    
    settings = get_settings()
    url = f"{settings.twelvelabs_base_url}/indexes"
    headers = {"x-api-key": settings.twelvelabs_api_key}
    
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            indexes = data.get("data", [])
            print(f"[OK] API connection successful")
            print(f"Found {len(indexes)} indexes")
            
            # Check if our index exists
            our_index = settings.twelvelabs_index_id
            found = any(idx.get("_id") == our_index for idx in indexes)
            if found:
                print(f"[OK] Index {our_index} found")
            else:
                print(f"[WARNING] Index {our_index} not found in your account")
                print("Available indexes:")
                for idx in indexes[:3]:
                    print(f"  - {idx.get('_id')}: {idx.get('index_name')}")
            return True
        else:
            print(f"[ERROR] API returned {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return False

# Run the video analysis
def run_real_analysis(mp4_path: Path):
    print("\n" + "=" * 70)
    print("STARTING VIDEO ANALYSIS")
    print("=" * 70)
    print(f"Video: {mp4_path.name}")
    print("This may take several minutes...\n")
    
    from app.services.twelvelabs_client import run_analysis
    
    try:
        pack = run_analysis(
            source_type="s3",
            source_url_for_pack=str(mp4_path),
            video_file_path=mp4_path,
        )
        
        print("\n" + "=" * 70)
        print("[OK] ANALYSIS COMPLETE")
        print("=" * 70)
        print(f"Video ID: {pack.video_id}")
        print(f"Provider: {pack.model_provider}")
        print()
        
        print("=" * 70)
        print("TRANSCRIPT")
        print("=" * 70)
        print(pack.transcript[:500] if pack.transcript else "(empty)")
        if len(pack.transcript) > 500:
            print(f"... ({len(pack.transcript)} total characters)")
        print()
        
        print("=" * 70)
        print(f"CHAPTERS ({len(pack.chapters)})")
        print("=" * 70)
        for i, ch in enumerate(pack.chapters[:5], 1):
            print(f"{i}. [{ch.start:.0f}s - {ch.end:.0f}s] {ch.summary}")
        if len(pack.chapters) > 5:
            print(f"... and {len(pack.chapters) - 5} more")
        print()
        
        print("=" * 70)
        print(f"KEY EVENTS ({len(pack.events)})")
        print("=" * 70)
        for e in pack.events[:5]:
            print(f"@{e.t:.0f}s [{e.type}] {e.label}")
        if len(pack.events) > 5:
            print(f"... and {len(pack.events) - 5} more")
        print()
        
        print("=" * 70)
        print(f"KEY QUOTES ({len(pack.key_quotes)})")
        print("=" * 70)
        for q in pack.key_quotes[:5]:
            print(f"@{q.t:.0f}s: {q.text[:80]}")
        if len(pack.key_quotes) > 5:
            print(f"... and {len(pack.key_quotes) - 5} more")
        
        return pack
        
    except Exception as e:
        print("\n" + "=" * 70)
        print("[ERROR] ANALYSIS FAILED")
        print("=" * 70)
        print(f"Error: {type(e).__name__}")
        print(f"Message: {str(e)}")
        
        # Try to get more details
        import traceback
        print("\nFull traceback:")
        traceback.print_exc()
        return None

def main():
    print("\n" + "=" * 70)
    print("NOIRVISION - TWELVELABS REAL API TEST")
    print("=" * 70)
    
    # Step 1: Validate config
    if not validate_config():
        print("\n[ERROR] Configuration invalid. Fix the issues above and try again.")
        return 1
    
    # Step 2: Check video file
    mp4_path = check_video_file()
    if not mp4_path:
        print("\n[ERROR] Video file not found. Add sample.mp4 to test_fixtures/")
        return 1
    
    # Step 3: Test API connection
    if not test_api_connection():
        print("\n[ERROR] API connection failed. Check your API key and network.")
        return 1
    
    # Step 4: Run analysis
    pack = run_real_analysis(mp4_path)
    
    if pack:
        print("\n" + "=" * 70)
        print("[OK] SUCCESS - Real TwelveLabs analysis complete!")
        print("=" * 70)
        return 0
    else:
        print("\n" + "=" * 70)
        print("[ERROR] FAILED - See errors above")
        print("=" * 70)
        return 1

if __name__ == "__main__":
    sys.exit(main())
