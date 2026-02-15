#!/usr/bin/env bash
# Backboard API – curl examples. Default base URL: http://localhost:8000
# Usage: ./scripts/curl_backboard.sh [BASE_URL]

set -e
BASE="${1:-http://localhost:8000}"

echo "=== Root ==="
curl -sS "$BASE/" | jq .

echo -e "\n=== Health ==="
curl -sS "$BASE/health" | jq .

echo -e "\n=== Demo: supported claim ==="
curl -sS "$BASE/demo/supported" | jq .

echo -e "\n=== Demo: contradicted claim ==="
curl -sS "$BASE/demo/contradicted" | jq .

echo -e "\n=== POST /analyze/text (claim text only, uses mock video) ==="
curl -sS -X POST "$BASE/analyze/text?claim_text=On%20Friday%20night%20a%20man%20in%20a%20trench%20coat%20demanded%20my%20wallet%20near%20the%20warehouse." | jq .

echo -e "\n=== POST /analyze (full body: claim + video_analysis) ==="
curl -sS -X POST "$BASE/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "claim": {
      "claim_text": "A man in a trench coat and fedora pulled out a knife and took my wallet near the old warehouse.",
      "case_id": "test-001"
    },
    "video_analysis": {
      "source": "CCTV_5thSt.mp4",
      "duration": "3m 42s",
      "detections": [
        {"timestamp": "23:02:15", "description": "Person in trench coat, fedora", "objects": ["trench coat", "fedora"], "confidence": 92},
        {"timestamp": "23:02:35", "description": "Arm extends, knife detected", "objects": ["knife"], "confidence": 87},
        {"timestamp": "23:02:40", "description": "Handover of small object", "objects": ["wallet"], "confidence": 78}
      ],
      "on_screen_text": "OLD WAREHOUSE",
      "gps_metadata": "40.7128° N, 74.0060° W",
      "speech_transcription": null
    }
  }' | jq .

echo -e "\nDone."
