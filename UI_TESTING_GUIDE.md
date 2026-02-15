# NoirVision UI Testing Guide

**Complete step-by-step guide to test the system through the browser**

---

## Prerequisites Checklist

Before starting, verify:
- [ ] Backend server is running on port 8000
- [ ] Frontend server is running on port 3000
- [ ] You have the test video file: `backend/video/sample.mp4`
- [ ] Environment variables are configured in both `.env` files

---

## Step 1: Start the Backend Server

### Open Terminal 1

```bash
cd /Users/manav/Desktop/NoirVision/backend

# Activate virtual environment
source venv/bin/activate

# Start the backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
```
✅ NoirVision analyzer initialized with Backboard AI
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**Verification:**
- Server should show "Application startup complete"
- No errors in the output
- Port 8000 is being used

**If it fails:**
```bash
# Kill any existing process on port 8000
lsof -ti:8000 | xargs kill -9

# Try starting again
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Step 2: Start the Frontend Server

### Open Terminal 2 (New Terminal)

```bash
cd /Users/manav/Desktop/NoirVision/frontend

# Start the frontend dev server
npm run dev
```

**Expected Output:**
```
  VITE v7.3.1  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Verification:**
- Server shows "ready"
- URL is http://localhost:3000
- No compilation errors

**If it fails:**
```bash
# Make sure dependencies are installed
npm install

# Try starting again
npm run dev
```

---

## Step 3: Open the Application

### In Your Web Browser

1. **Open Chrome, Firefox, or Safari**

2. **Navigate to:** `http://localhost:3000`

3. **You should see:**
   - NoirVision logo
   - Dark noir-themed interface
   - Login or Workspace page

**If you see a blank page:**
- Open browser console (F12 or Cmd+Option+I)
- Check for errors in the Console tab
- Verify frontend server is running in Terminal 2

---

## Step 4: Main Workspace Interface

### What You Should See:

```
┌─────────────────────────────────────────────────────────────┐
│  NOIRVISION                                    [User Icon]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Sidebar]            [Main Workspace]         [Chat Panel]  │
│                                                               │
│  • New Case           ┌─────────────────┐                   │
│                       │  Case Title     │                   │
│  Case History:        │  [Input Box]    │                   │
│  (empty initially)    └─────────────────┘                   │
│                                                               │
│                       ┌─────────────────┐                   │
│                       │  Witness Claim  │                   │
│                       │  [Text Area]    │                   │
│                       └─────────────────┘                   │
│                                                               │
│                       ┌─────────────────┐                   │
│                       │  Upload Video   │                   │
│                       │  [Drop Zone]    │                   │
│                       └─────────────────┘                   │
│                                                               │
│                       [ ANALYZE EVIDENCE ]                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 5: Enter Case Information

### 5.1 Enter Case Title

1. **Click in the "Case Title" field**
2. **Type:** `Traffic Analysis Test Case`
3. **Press Tab or click outside** to confirm

**What happens:**
- Text should appear in the field
- Field should accept input

### 5.2 Enter Witness Claim

1. **Click in the "Witness Claim" text area**
2. **Type:**
   ```
   Multiple vehicles including buses and trucks passing through a busy intersection. I observed heavy traffic with various types of vehicles moving in different directions.
   ```
3. **The text area should expand** as you type

**Tips:**
- You can use any claim text you want
- The longer and more specific, the better the analysis
- Examples:
  - "Only cars moving on the road"
  - "Buses and trucks at an intersection"
  - "Heavy traffic with multiple vehicle types"

---

## Step 6: Upload Test Video

You have **two options** to upload the video:

### Option A: Drag and Drop (Recommended)

1. **Open Finder** (Mac) or File Explorer (Windows)
2. **Navigate to:** `/Users/manav/Desktop/NoirVision/backend/video/`
3. **Find:** `sample.mp4`
4. **Drag the file** onto the upload zone in the browser
5. **Drop it** when you see the drop zone highlight

**Visual Feedback:**
- Drop zone should highlight when dragging over it
- File name should appear after dropping: `sample.mp4`

### Option B: Click to Browse

1. **Click on the upload zone** (anywhere in the dashed box)
2. **File picker dialog opens**
3. **Navigate to:** `/Users/manav/Desktop/NoirVision/backend/video/`
4. **Select:** `sample.mp4`
5. **Click "Open"**

**Verification:**
- File name appears: `sample.mp4`
- File size shown: ~2.7 MB
- ✓ Ready to analyze

---

## Step 7: Start Analysis

### 7.1 Click "ANALYZE EVIDENCE" Button

1. **Verify all fields are filled:**
   - ✓ Case Title: Entered
   - ✓ Witness Claim: Entered
   - ✓ Video File: Uploaded

2. **Click the big "ANALYZE EVIDENCE" button**

**What happens immediately:**
- Button becomes disabled
- Screen transitions to loading state

---

## Step 8: Watch the Analysis Process

### Loading Screen

You'll see a **loading animation** with progress messages:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            [Spinning Circle Animation]          │
│                                                 │
│         Processing your case...                 │
│                                                 │
│   Phase 1: Uploading video...                  │
│   Phase 2: Processing video with TwelveLabs... │
│   Phase 3: Analyzing credibility with AI...    │
│                                                 │
│   This may take 1-2 minutes                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Timeline (Expected):
- **0-5 seconds:** Uploading video...
- **5-45 seconds:** Processing video with TwelveLabs...
- **45-65 seconds:** Analyzing credibility with AI...

**What's happening in the backend:**
1. Video uploaded to backend
2. TwelveLabs indexes and analyzes video (~30-40s)
3. Backboard AI compares claim vs evidence (~15-20s)
4. Report generated and formatted

**Monitor in Terminal 1:**
You should see log messages like:
```
INFO: Starting complete analysis for claim: Multiple vehicles...
INFO: Processing uploaded video: sample.mp4
INFO: ✅ TwelveLabs analysis complete, video_id=xxxxx
INFO: Starting Backboard AI credibility analysis...
INFO: ✅ Complete analysis done, case_id=xxxx, score=XX
```

---

## Step 9: View Results

### After analysis completes, you'll see the **Results Screen**:

```
┌─────────────────────────────────────────────────────────────┐
│  CREDIBILITY REPORT                                         │
│  Case: Traffic Analysis Test Case                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CREDIBILITY SCORE: XX/100                                 │
│  VERDICT: ✅ CLAIM SUPPORTED                               │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │ WITNESS CLAIM                                    │      │
│  │ Multiple vehicles including buses and trucks...  │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │ VIDEO EVIDENCE ANALYSIS                          │      │
│  │ • Duration: X seconds                            │      │
│  │ • Events detected: X                             │      │
│  │ • Key detections: [vehicles, traffic, etc]       │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │ COMPARISON RESULTS                               │      │
│  │ ✓ Time Match                                     │      │
│  │ ✓ Location Match                                 │      │
│  │ ✓ Event Match                                    │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  RECOMMENDATION:                                           │
│  "Analysis supports the witness claim..."                  │
│                                                             │
│  [ VIEW FULL ASCII REPORT ]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 10: Explore the Results

### 10.1 Check the Credibility Score

**Look for:**
- Score number (0-100)
- Color coding:
  - Green (80-100): High credibility
  - Yellow (50-79): Moderate credibility
  - Red (0-49): Low credibility

**For the test video, expect:**
- Score: 60-80 (depending on your claim)
- Verdict: Usually "CLAIM SUPPORTED"

### 10.2 Review Comparisons

**Scroll down to see:**
- Category-by-category comparison
- Match indicators (✓ or ✗)
- Detailed explanations

**Example:**
```
✓ Vehicle Type Match
  Claim: "buses and trucks"
  Video: Multiple vehicle types detected including buses
  Confidence: 85%

✓ Activity Match
  Claim: "passing through intersection"
  Video: Traffic movement at intersection observed
  Confidence: 90%
```

### 10.3 View ASCII Report

1. **Click "VIEW FULL ASCII REPORT"** button
2. **A modal/section opens** showing the noir-styled report
3. **Should look like:**

```
╔══════════════════════════════════════════════════════════════╗
║ VERITAS CREDIBILITY REPORT                                   ║
║ Case #: XXXX-XX-XX-XXX                                      ║
║ "The Whiskey Verdict"                                       ║
╚══════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────┐
│ WITNESS CLAIM                                                │
├──────────────────────────────────────────────────────────────┤
│ Multiple vehicles including buses and trucks...              │
└──────────────────────────────────────────────────────────────┘

[...more sections...]
```

---

## Step 11: Test Different Scenarios

### Scenario A: Contradictory Claim

1. **Click "New Case"** in sidebar
2. **Enter claim:** "Only pedestrians walking, no vehicles at all"
3. **Upload same video:** `sample.mp4`
4. **Analyze**

**Expected Result:**
- Lower credibility score (20-40)
- Verdict: "CLAIM CONTRADICTED"
- Comparisons show mismatches

### Scenario B: Partial Match

1. **New case**
2. **Enter claim:** "Only cars moving, no buses or trucks"
3. **Upload:** `sample.mp4`
4. **Analyze**

**Expected Result:**
- Moderate score (50-70)
- Verdict: "CLAIM SUPPORTED (with discrepancies)"
- Some matches, some mismatches

### Scenario C: Very Specific Claim

1. **New case**
2. **Enter claim:** "At 00:05 timestamp, a bus enters from the left side of the frame"
3. **Upload:** `sample.mp4`
4. **Analyze**

**Expected Result:**
- High score if claim matches specific events
- Detailed timestamp analysis

---

## Step 12: Check Case History

### In the Sidebar

After completing an analysis:
1. **Look at the left sidebar**
2. **You should see your case listed:**
   ```
   Recent Cases:
   • Traffic Analysis Test Case
     Score: 75/100 ✓
     2 minutes ago
   ```

3. **Click on a previous case** to view it again

---

## Troubleshooting

### Problem: Nothing happens when clicking "Analyze"

**Check:**
1. All fields filled? (Title, Claim, Video)
2. Video uploaded successfully? (file name visible)
3. Browser console for errors (F12)

**Fix:**
```javascript
// In browser console, check:
console.log('Checking API connection...')
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend:', d))
  .catch(e => console.error('❌ Backend not accessible:', e))
```

### Problem: Analysis takes too long (>3 minutes)

**Check Terminal 1 (Backend):**
- Look for error messages
- Check if TwelveLabs is processing
- Verify API keys are valid

**Fix:**
- Stop and restart backend server
- Check `backend/.env` has correct API keys

### Problem: Error message appears

**Common Errors:**

1. **"Backend not responding"**
   - Backend server not running
   - Check Terminal 1

2. **"Analysis failed: Invalid API key"**
   - TwelveLabs or Backboard API key invalid
   - Check `backend/.env`

3. **"Video upload failed"**
   - File too large (>100MB)
   - Wrong file format
   - Use `sample.mp4` for testing

### Problem: Results don't display

**Check:**
1. Browser console (F12) for JavaScript errors
2. Network tab - did the request complete?
3. Response tab - what did the API return?

**Fix:**
- Refresh page (Cmd+R or Ctrl+R)
- Clear browser cache
- Try in incognito/private window

---

## Success Criteria

### You've successfully tested the UI when:

- ✅ You can enter case information
- ✅ You can upload a video file
- ✅ Analysis starts and shows progress
- ✅ Analysis completes in ~60 seconds
- ✅ Results display with score and verdict
- ✅ Comparisons are shown
- ✅ ASCII report can be viewed
- ✅ Case appears in sidebar history

---

## Quick Test Script

**Complete test in 2 minutes:**

1. Open http://localhost:3000
2. Title: `Quick Test`
3. Claim: `Multiple vehicles moving on the road`
4. Upload: `backend/video/sample.mp4`
5. Click "ANALYZE EVIDENCE"
6. Wait ~60 seconds
7. Check score (should be 60-80)
8. Check verdict (should be SUPPORTED)
9. View ASCII report
10. ✅ Test complete!

---

## Terminal Commands Quick Reference

### Check if servers are running:
```bash
# Backend (should show PID)
lsof -ti:8000

# Frontend (should show PID)
lsof -ti:3000
```

### View backend logs:
```bash
# If running with output redirect
tail -f /tmp/noirvision_backend.log

# Or just watch Terminal 1
```

### Restart everything:
```bash
# Kill servers
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Restart backend
cd backend && source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Restart frontend (in new terminal)
cd frontend && npm run dev
```

---

## Expected Performance

**Typical test with `sample.mp4`:**
- Upload: < 2 seconds
- TwelveLabs: 30-40 seconds
- Backboard AI: 15-20 seconds
- **Total: 55-65 seconds**

**Credibility Scores:**
- Generic claim ("vehicles moving"): 60-75
- Specific accurate claim: 80-95
- Contradictory claim: 10-40

---

## Next Steps After Testing

Once UI testing is successful:
1. Try with your own video files
2. Test different types of claims
3. Explore case history
4. Test authentication (if enabled)
5. Test on different browsers
6. Test on mobile (responsive design)

---

**Happy Testing! 🎉**

*"In the city of lies, trust the footage."*
