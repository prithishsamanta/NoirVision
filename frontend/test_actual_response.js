// Test transformation with actual API response
const sampleResponse = {
    "report": {
        "case_id": "case-1771140687058",
        "case_title": "The Deceptive Intersection",
        "witness_claim": "only cars",
        "video_analysis": {
            "source": "sample.mp4",
            "duration": "41s",
            "detections": [
                {
                    "timestamp": "00:00:00",
                    "description": "Yellow Bus Crossing",
                    "objects": ["Yellow Bus Crossing"],
                    "confidence": null
                }
            ],
            "on_screen_text": null,
            "gps_metadata": null,
            "speech_transcription": [
                {
                    "timestamp": "00:00:00",
                    "speaker": "Person",
                    "text": "A yellow bus crosses"
                }
            ]
        },
        "comparisons": [
            {
                "category": "Time Match",
                "match": false,
                "explanation": "The witness claim does not specify a time"
            }
        ],
        "credibility_score": 20,
        "verdict": "CLAIM CONTRADICTED – LIKELY FALSE REPORT",
        "recommendation": "→ Based on discrepancies...",
        "evidence_summary": {
            "Time Match": {
                "match": false,
                "detail": "The witness claim does not specify a time"
            }
        },
        "detective_note": "The dame's story fell apart...",
        "timestamp": "2026-02-15T02:32:24.372907"
    },
    "formatted_report": "ASCII ART REPORT...",
    "video_id": "6991765041a8303306571f86"
};

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

console.log('Testing transformation with actual API response...\n');

const transformed = transformBackendResponse(sampleResponse);

console.log('Transformation complete!\n');
console.log('Transformed fields check:\n');

const requiredFields = [
  'caseId',
  'caseTitle',
  'claim',
  'videoSource',
  'videoDuration',
  'keyDetections',
  'onScreenText',
  'gpsMetadata',
  'speechTranscription',
  'verdict',
  'credibilityScore',
  'comparisons',
  'recommendation',
  'evidenceSummary',
  'detectiveNote',
  'formattedReport'
];

let allFieldsPresent = true;

requiredFields.forEach(field => {
  const exists = field in transformed;
  const value = transformed[field];
  const isArray = Array.isArray(value);
  const length = isArray ? value.length : (typeof value === 'string' ? value.length : 'N/A');
  
  console.log(`${exists ? 'PASS' : 'FAIL'} ${field}: ${exists ? (isArray ? `array[${length}]` : typeof value) : 'MISSING'}`);
  
  if (!exists) allFieldsPresent = false;
});

console.log('\nDetailed field values:\n');
console.log('caseId:', transformed.caseId);
console.log('verdict:', transformed.verdict);
console.log('credibilityScore:', transformed.credibilityScore);
console.log('keyDetections count:', transformed.keyDetections.length);
console.log('comparisons count:', transformed.comparisons.length);
console.log('evidenceSummary count:', transformed.evidenceSummary.length);

console.log('\nSample keyDetection:');
console.log(JSON.stringify(transformed.keyDetections[0], null, 2));

console.log('\nSample comparison:');
console.log(JSON.stringify(transformed.comparisons[0], null, 2));

console.log('\nSample evidenceSummary:');
console.log(transformed.evidenceSummary[0]);

if (allFieldsPresent) {
  console.log('\nALL REQUIRED FIELDS PRESENT!');
  console.log('Transformation is working correctly!');
  console.log('Frontend should render without issues!');
} else {
  console.log('\nSOME FIELDS MISSING!');
  console.log('This will cause rendering errors!');
}

console.log('\nReady for frontend rendering!');
