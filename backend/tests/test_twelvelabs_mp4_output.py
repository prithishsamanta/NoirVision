"""
Test TwelveLabs video analysis from a local MP4 file in the project.

- Expects: backend/test_fixtures/sample.mp4 (place your MP4 there).
- If the file is missing: runs in mock mode and prints placeholder text.
- If the file exists: runs real TwelveLabs analysis when TWELVELABS_API_KEY and
  TWELVELABS_INDEX_ID are set; otherwise falls back to mock and prints a note.

Run from backend/:
  python tests/test_twelvelabs_mp4_output.py
  pytest tests/test_twelvelabs_mp4_output.py -v -s

Env: TWELVELABS_MOCK=true for instant fake output; real key + TWELVELABS_INDEX_ID for real analysis.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

# Load .env from project root if present (so root .env is used when running from backend/)
try:
    from dotenv import load_dotenv
    root_env = os.path.join(BACKEND_DIR, "..", ".env")
    if os.path.isfile(root_env):
        load_dotenv(root_env)
except ImportError:
    pass

DEFAULT_MP4 = os.path.join(BACKEND_DIR, "test_fixtures", "sample.mp4")


def run_mp4_analysis(mp4_path: str | None = None) -> None:
    mp4_path = mp4_path or DEFAULT_MP4
    from app.config import get_settings
    from app.services.twelvelabs_client import run_analysis

    if not os.path.isfile(mp4_path):
        print(f"MP4 not found: {mp4_path}")
        print("Using mock mode with placeholder output. Add an MP4 to test_fixtures/sample.mp4 for real analysis.\n")
        os.environ.setdefault("TWELVELABS_MOCK", "true")
        os.environ.setdefault("S3_BUCKET", "dummy")
        pack = run_analysis(
            video_url="https://example.com/dummy.mp4",
            source_type="s3",
            source_url_for_pack=mp4_path,
        )
        _print_pack(pack)
        return

    # Decide real vs mock before loading config (config is cached)
    has_key = bool(os.environ.get("TWELVELABS_API_KEY") or os.environ.get("TWELVE_LABS_API_KEY"))
    has_index = bool(os.environ.get("TWELVELABS_INDEX_ID"))
    if not has_key or not has_index:
        os.environ["TWELVELABS_MOCK"] = "true"
        os.environ.setdefault("S3_BUCKET", "dummy")
        print("Using mock mode (set TWELVELABS_API_KEY and TWELVELABS_INDEX_ID in .env for real analysis).")
    print(f"MP4: {mp4_path}\n")

    try:
        pack = run_analysis(
            source_type="s3",
            source_url_for_pack=mp4_path,
            video_file_path=mp4_path,
        )
    except Exception as e:
        print(f"TwelveLabs API error: {e}")
        print("Falling back to mock output.\n")
        os.environ["TWELVELABS_MOCK"] = "true"
        os.environ.setdefault("S3_BUCKET", "dummy")
        # Clear config cache so next get_settings sees TWELVELABS_MOCK=true
        get_settings.cache_clear()
        pack = run_analysis(
            source_type="s3",
            source_url_for_pack=mp4_path,
            video_file_path=mp4_path,
        )
    _print_pack(pack)


def _print_pack(pack) -> None:
    print("=" * 60)
    print("TRANSCRIPT")
    print("=" * 60)
    print(pack.transcript or "(empty)")
    print()
    print("=" * 60)
    print("CHAPTERS")
    print("=" * 60)
    for i, ch in enumerate(pack.chapters, 1):
        print(f"  [{ch.start:.0f}s - {ch.end:.0f}s] {ch.summary}")
    if not pack.chapters:
        print("  (none)")
    print()
    print("=" * 60)
    print("KEY EVENTS")
    print("=" * 60)
    for e in pack.events:
        print(f"  @{e.t:.0f}s [{e.type}] {e.label}: {e.evidence}")
    if not pack.events:
        print("  (none)")
    print()
    print("=" * 60)
    print("KEY QUOTES")
    print("=" * 60)
    for q in pack.key_quotes:
        print(f"  @{q.t:.0f}s: {q.text}")
    if not pack.key_quotes:
        print("  (none)")
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  video_id: {pack.video_id}")
    print(f"  model_provider: {pack.model_provider}")


def test_twelvelabs_mp4_produces_text() -> None:
    """Pytest: run analysis on sample.mp4 if present, else mock; assert we get text."""
    if os.path.isfile(DEFAULT_MP4):
        from app.services.twelvelabs_client import run_analysis
        pack = run_analysis(
            source_type="s3",
            source_url_for_pack=DEFAULT_MP4,
            video_file_path=DEFAULT_MP4,
        )
    else:
        os.environ.setdefault("TWELVELABS_MOCK", "true")
        os.environ.setdefault("S3_BUCKET", "dummy")
        from app.services.twelvelabs_client import run_analysis
        pack = run_analysis(
            video_url="https://example.com/dummy.mp4",
            source_type="s3",
            source_url_for_pack=DEFAULT_MP4,
        )
    has_text = (
        bool(pack.transcript)
        or len(pack.chapters) > 0
        or len(pack.events) > 0
        or len(pack.key_quotes) > 0
    )
    assert has_text, "Expected some textual output from video analysis"


if __name__ == "__main__":
    run_mp4_analysis()
