#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  NoirVision Complete Flow Test"
echo "════════════════════════════════════════════════════════════"
echo ""

# Test 1: Backend Health
echo "📍 Test 1: Backend Health Check"
HEALTH=$(curl -s http://localhost:8000/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Backend is healthy"
    echo "$HEALTH"
else
    echo "❌ Backend health check failed"
    echo "$HEALTH"
    exit 1
fi
echo ""

# Test 2: Frontend Availability
echo "📍 Test 2: Frontend Availability"
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND" = "200" ]; then
    echo "✅ Frontend is running (HTTP $FRONTEND)"
else
    echo "❌ Frontend not accessible (HTTP $FRONTEND)"
    exit 1
fi
echo ""

# Test 3: Backend API with actual video
echo "📍 Test 3: Backend /analyze/complete API"
echo "Uploading video and analyzing (this takes ~60 seconds)..."
echo ""

VIDEO_PATH="/Users/manav/Desktop/NoirVision/backend/video/sample.mp4"

if [ ! -f "$VIDEO_PATH" ]; then
    echo "❌ Video file not found: $VIDEO_PATH"
    echo "Looking for video files..."
    find /Users/manav/Desktop/NoirVision/backend -name "*.mp4" -o -name "sample*"
    exit 1
fi

echo "Video file: $VIDEO_PATH"
echo "File size: $(ls -lh "$VIDEO_PATH" | awk '{print $5}')"
echo ""
echo "Sending request to backend..."
echo "⏳ Please wait ~60 seconds for TwelveLabs + Backboard analysis..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8000/analyze/complete \
  -F "claim=only cars" \
  -F "video_file=@$VIDEO_PATH" \
  -F "case_id=test-$(date +%s)" \
  --max-time 120)

if [ $? -ne 0 ]; then
    echo "❌ API request failed or timed out"
    exit 1
fi

# Check if response contains expected fields
if echo "$RESPONSE" | grep -q '"case_id"'; then
    echo "✅ API Response received successfully"
    echo ""
    
    # Extract key fields
    CASE_ID=$(echo "$RESPONSE" | grep -o '"case_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    VERDICT=$(echo "$RESPONSE" | grep -o '"verdict":"[^"]*"' | head -1 | cut -d'"' -f4)
    SCORE=$(echo "$RESPONSE" | grep -o '"credibility_score":[0-9]*' | head -1 | cut -d':' -f2)
    
    echo "📊 API Response Summary:"
    echo "  Case ID: $CASE_ID"
    echo "  Verdict: $VERDICT"
    echo "  Credibility Score: $SCORE/100"
    echo ""
    
    # Save response for inspection
    echo "$RESPONSE" > /tmp/noirvision_test_response.json
    echo "Full response saved to: /tmp/noirvision_test_response.json"
    echo ""
    
    # Test 4: Validate Response Structure
    echo "📍 Test 4: Response Structure Validation"
    
    HAS_REPORT=$(echo "$RESPONSE" | grep -c '"report"')
    HAS_FORMATTED=$(echo "$RESPONSE" | grep -c '"formatted_report"')
    HAS_VIDEO_ID=$(echo "$RESPONSE" | grep -c '"video_id"')
    HAS_DETECTIONS=$(echo "$RESPONSE" | grep -c '"detections"')
    HAS_COMPARISONS=$(echo "$RESPONSE" | grep -c '"comparisons"')
    
    echo "  report field: $([ $HAS_REPORT -gt 0 ] && echo '✅' || echo '❌')"
    echo "  formatted_report field: $([ $HAS_FORMATTED -gt 0 ] && echo '✅' || echo '❌')"
    echo "  video_id field: $([ $HAS_VIDEO_ID -gt 0 ] && echo '✅' || echo '❌')"
    echo "  detections field: $([ $HAS_DETECTIONS -gt 0 ] && echo '✅' || echo '❌')"
    echo "  comparisons field: $([ $HAS_COMPARISONS -gt 0 ] && echo '✅' || echo '❌')"
    echo ""
    
    if [ $HAS_REPORT -gt 0 ] && [ $HAS_FORMATTED -gt 0 ] && [ $HAS_VIDEO_ID -gt 0 ]; then
        echo "✅ All required fields present"
    else
        echo "❌ Some required fields missing"
        exit 1
    fi
    
else
    echo "❌ API Response invalid or missing case_id"
    echo "Response received:"
    echo "$RESPONSE" | head -20
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ ALL TESTS PASSED!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Summary:"
echo "  ✅ Backend is healthy"
echo "  ✅ Frontend is running"
echo "  ✅ /analyze/complete API works"
echo "  ✅ Response structure is valid"
echo ""
echo "🎯 Backend is ready for frontend integration!"
echo ""
echo "Next: Test in browser at http://localhost:3000"
