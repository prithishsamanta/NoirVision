/**
 * NoirVision API Client
 * Complete integration with backend /analyze/complete endpoint
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Submit video and claim for complete analysis
 * @param {Object} params
 * @param {string} params.claim - Witness claim text
 * @param {File} params.videoFile - Video file to analyze
 * @param {string} params.caseId - Optional case ID
 * @returns {Promise<Object>} - Analysis result with report and formatted_report
 */
export async function analyzeComplete({ claim, videoFile, caseId }) {
  const formData = new FormData();
  formData.append('claim', claim);
  
  if (videoFile) {
    formData.append('video_file', videoFile);
  }
  
  if (caseId) {
    formData.append('case_id', caseId);
  }

  const response = await fetch(`${API_BASE_URL}/analyze/complete`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Check backend health status
 * @returns {Promise<Object>} - Health status
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Backend is not responding');
  }
  
  return await response.json();
}

/**
 * Transform backend response to frontend format
 * @param {Object} backendResponse - Response from /analyze/complete
 * @returns {Object} - Frontend-compatible case data
 */
export function transformBackendResponse(backendResponse) {
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

export default {
  analyzeComplete,
  checkHealth,
  transformBackendResponse
};
