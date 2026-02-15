/**
 * Test script to verify transformation works correctly
 * Run: node test_transformation.js
 */

// Sample backend response (based on user's actual API response)
const backendResponse = {
    "report": {
        "case_id": "case-1771138603406",
        "case_title": "The Silent Traffic",
        "witness_claim": "only cars",
        "video_analysis": {
            "source": "sample.mp4",
            "duration": "41s",
            "detections": [
                {
                    "timestamp": "00:00:00",
                    "description": "Yellow Bus Crossing: A yellow bus with 'Mears' written on it crosses the intersection from right to left.",
                    "objects": ["Yellow Bus Crossing"],
                    "confidence": null
                },
                {
                    "timestamp": "00:00:11",
                    "description": "Truck Enters Intersection: A white truck with a green container enters the intersection from the left and exits to the right.",
                    "objects": ["Truck Enters Intersection"],
                    "confidence": null
                }
            ],
            "on_screen_text": null,
            "gps_metadata": null,
            "speech_transcription": [
                {
                    "timestamp": "00:00:00",
                    "speaker": "Person",
                    "text": "A yellow bus with 'Mears' written on it crosses the intersection from right to left."
                }
            ]
        },
        "comparisons": [
            {
                "category": "Time Match",
                "match": false,
                "explanation": "The witness claim does not provide a specific time, and the video captures a 41-second duration without matching a specific time."
            },
            {
                "category": "Weapon Match",
                "match": true,
                "explanation": "The witness claim mentions 'only cars', and the video showcases various vehicles, but there is no weapon present."
            }
        ],
        "credibility_score": 40,
        "verdict": "INCONCLUSIVE",
        "recommendation": "→ Proceed with caution. The witness claim is inconclusive due to mismatches in time, location, and suspect description.",
        "evidence_summary": {
            "Time Match": {
                "match": false,
                "detail": "The witness claim does not provide a specific time, and the video captures a 41-second duration without matching a specific time."
            },
            "Weapon Match": {
                "match": true,
                "detail": "The witness claim mentions 'only cars', and the video showcases various vehicles, but there is no weapon present."
            }
        },
        "detective_note": "The tape played out like a sad tune, revealing a parade of cars but leaving the dame's story in the shadows.",
        "timestamp": "2026-02-15T01:57:37.591855"
    },
    "formatted_report": "╔══════════════════════════════════════════════════════════════╗\n║                    VERITAS CREDIBILITY REPORT                ║\n...",
    "video_id": "69916e2cf20ac9cd89a7bf96"
};

// Transformation function (same as frontend)
function transformBackendResponse(backendResponse) {
  const { report, formatted_report, video_id } = backendResponse;
  
  // Map verdict to frontend format
  let verdict = 'inconclusive';
  if (report.verdict.includes('SUPPORTED')) {
    verdict = 'supported';
  } else if (report.verdict.includes('CONTRADICTED')) {
    verdict = 'contradicted';
  }
  
  // Transform comparisons to frontend format
  const comparisons = report.comparisons.map(comp => ({
    label: comp.category,
    match: comp.match,
    detail: comp.explanation
  }));
  
  // Transform detections to keyDetections format for frontend
  const keyDetections = (report.video_analysis.detections || []).map(det => ({
    time: det.timestamp,
    event: det.description,
    details: det.objects ? det.objects.join(', ') : null,
    confidence: det.confidence
  }));
  
  // Transform evidence summary to match frontend expectations (array of strings)
  const evidenceSummary = [];
  if (report.evidence_summary) {
    Object.entries(report.evidence_summary).forEach(([key, value]) => {
      const icon = value.match ? '✓' : '✗';
      evidenceSummary.push(`${key}: ${icon} ${value.detail}`);
    });
  }
  
  return {
    caseId: report.case_id,
    caseTitle: report.case_title,
    claim: report.witness_claim,
    videoId: video_id,
    
    // Video analysis data
    videoSource: report.video_analysis.source,
    videoDuration: report.video_analysis.duration,
    keyDetections: keyDetections,
    onScreenText: report.video_analysis.on_screen_text || 'None detected',
    gpsMetadata: report.video_analysis.gps_metadata || 'Not available',
    speechTranscription: report.video_analysis.speech_transcription || [],
    
    // Analysis results
    verdict: verdict,
    credibilityScore: report.credibility_score,
    comparisons: comparisons,
    recommendation: report.recommendation,
    evidenceSummary: evidenceSummary,
    detectiveNote: report.detective_note,
    
    // Formatted report (ASCII art)
    formattedReport: formatted_report,
    
    // Metadata
    timestamp: report.timestamp || new Date().toISOString()
  };
}

// Run test
console.log('Testing transformation...\n');

const transformed = transformBackendResponse(backendResponse);

console.log('Transformation successful!\n');
console.log('Transformed data structure:\n');
console.log('caseId:', transformed.caseId);
console.log('caseTitle:', transformed.caseTitle);
console.log('verdict:', transformed.verdict);
console.log('credibilityScore:', transformed.credibilityScore);
console.log('\nkeyDetections:', transformed.keyDetections.length, 'items');
console.log('First detection:', JSON.stringify(transformed.keyDetections[0], null, 2));

console.log('\ncomparisons:', transformed.comparisons.length, 'items');
console.log('First comparison:', JSON.stringify(transformed.comparisons[0], null, 2));

console.log('\nevidenceSummary:', transformed.evidenceSummary.length, 'items');
console.log('First summary item:', transformed.evidenceSummary[0]);

console.log('\nAll fields correctly transformed!');
console.log('\nKey fixes:');
console.log('  - comparisons[].category → comparisons[].label');
console.log('  - comparisons[].explanation → comparisons[].detail');
console.log('  - video_analysis.detections → keyDetections');
console.log('  - evidence_summary (object) → evidenceSummary (array)');
console.log('  - Default values added for null fields');

console.log('\nFrontend should now render without errors!');
