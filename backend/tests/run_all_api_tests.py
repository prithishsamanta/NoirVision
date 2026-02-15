"""
Run all API tests (Backboard + any others). Mocks backboard so no SDK/key needed.
Usage: python -m tests.run_all_api_tests   OR   pytest tests/ -v
"""
import sys
import os

# Mock backboard before app is loaded
if "backboard" not in sys.modules:
    from unittest.mock import MagicMock
    sys.modules["backboard"] = MagicMock()
os.environ.setdefault("BACKBOARD_API_KEY", "test-key")

import pytest

if __name__ == "__main__":
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    sys.exit(pytest.main(["-v", tests_dir]))
