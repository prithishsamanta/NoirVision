# NoirVision - Frontend & Backend Integration Guide

## 🎯 Integration Complete!

The frontend is now connected to the backend API. Here's how everything works together.

---

## 🚀 Quick Start (Both Servers)

### Terminal 1: Start Backend
```bash
cd backend
./start_server.sh
```
Backend runs on: `http://localhost:8000`

### Terminal 2: Start Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```
Frontend runs on: `http://localhost:5173` (or similar)

---

## 📡 API Integration Details

### What's Connected:

✅ **File Upload** - Frontend sends video files to backend  
✅ **Claim Submission** - Text input sent to `/analyze/complete`  
✅ **Real-time Analysis** - 50-60 second processing time  
✅ **Progress Updates** - Loading states with messages  
✅ **Error Handling** - User-friendly error messages  
✅ **Report Display** - Transforms backend JSON to UI format  

### API Flow:

```
User uploads video + claim
    ↓
Frontend: FormData with video file
    ↓
Backend: POST /analyze/complete
    ↓
TwelveLabs: Video processing (~35 sec)
    ↓
Backboard AI: Credibility analysis (~15 sec)
    ↓
Backend: Returns JSON report
    ↓
Frontend: Transforms & displays report
```

---

## 🧪 Testing the Integration

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"healthy","noirvision_configured":true,...}`

### 2. Frontend Test
1. Open browser: `http://localhost:5173`
2. Login/Signup (if required)
3. Go to Workspace
4. Fill in:
   - **Case Title:** "Traffic Investigation"
   - **Witness Claim:** "Multiple vehicles including buses and trucks passing through a busy intersection during daytime."
   - **Upload Video:** Use `backend/video/sample.mp4`
5. Click "BEGIN INVESTIGATION"
6. Wait ~55 seconds
7. See real credibility report!

---

## 📊 Expected Results

### For Sample Video with Traffic Claim:

- **Credibility Score:** 80-100/100
- **Verdict:** ✅ CLAIM SUPPORTED
- **Video ID:** (TwelveLabs ID)
- **Comparisons:** 
  - ✅ Location Match
  - ✅ Event Sequence
  - ✅ Weapon Match (none)
  - ⚠️ Time Match (not specified)
  - ⚠️ Suspect Description (N/A)

---

## 🔧 Configuration Files

### Backend `.env`
```bash
BACKBOARD_API_KEY=your_key_here
TWELVELABS_API_KEY=your_key_here
TWELVELABS_INDEX_ID=your_index_here
TWELVELABS_MOCK=false
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:8000
```

---

## 📁 Key Integration Files

### Frontend:
- `/src/api/analysis.js` - API client for backend
- `/src/pages/Workspace.jsx` - Main UI component (updated)
- `.env` - API URL configuration

### Backend:
- `/app/main.py` - FastAPI server
- Endpoint: `POST /analyze/complete`
- Response: JSON with report + formatted_report

---

## 🐛 Troubleshooting

### CORS Errors?
Backend already has CORS enabled for all origins. If issues persist:
1. Check backend console for CORS logs
2. Verify frontend is using correct API_URL
3. Ensure both servers are running

### File Upload Fails?
1. Check file size (max ~10MB recommended)
2. Verify video format (MP4, MOV, AVI)
3. Check backend logs for errors

### Analysis Takes Too Long?
- Normal: 50-60 seconds for first analysis
- TwelveLabs indexing: ~35 seconds
- Backboard AI: ~15 seconds
- Subsequent analyses (cached video): ~15 seconds

### Backend Not Responding?
```bash
# Check if running
curl http://localhost:8000/health

# Restart if needed
cd backend
./start_server.sh
```

### Frontend Can't Connect?
1. Check `.env` file has correct `VITE_API_URL`
2. Restart frontend dev server
3. Clear browser cache

---

## 🎨 UI Features

### Loading States:
- "Uploading video..."
- "Processing video with TwelveLabs..."
- "Analyzing credibility with AI..."

### Error Handling:
- Missing fields validation
- File upload errors
- Network errors
- Backend errors

### Report Display:
- Case title and ID
- Credibility score (0-100)
- Color-coded verdict
- Detailed comparisons
- Investigation recommendations
- Detective notes (noir-styled)

---

## 📈 Performance Tips

### For Faster Testing:
1. Use the same video multiple times (TwelveLabs caches)
2. Keep backend running (no restart needed)
3. Use smaller video files (<5MB)

### For Production:
1. Set `VITE_API_URL` to deployed backend
2. Enable proper CORS restrictions
3. Add rate limiting
4. Consider video upload size limits

---

## ✅ Integration Checklist

- [x] API client created (`analysis.js`)
- [x] Workspace component updated
- [x] File upload working
- [x] FormData submission
- [x] Loading states
- [x] Error handling
- [x] Response transformation
- [x] Report display
- [x] Environment configuration
- [x] CORS enabled

---

## 🎯 Next Steps

1. **Test with Real Data:**
   - Upload different videos
   - Try various claims
   - Test edge cases

2. **UI Enhancements (Optional):**
   - Add progress bar
   - Show video preview
   - Add case history

3. **Demo Preparation:**
   - Prepare test cases
   - Practice walkthrough
   - Test on different browsers

---

**NoirVision: Frontend ↔ Backend Integration COMPLETE!** ✅

"In the city of lies, trust the footage." 🎷
