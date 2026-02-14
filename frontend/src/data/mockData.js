// ============================================
// NOIRVISION — Mock Investigation Data
// VERITAS CREDIBILITY REPORT format
// ============================================

export const MOCK_SUPPORTED_CASE = {
  caseId: '2026-02-14-001',
  caseTitle: 'The Whiskey Verdict',
  verdict: 'supported',
  credibilityScore: 92,
  statusLabel: 'CLAIM SUPPORTED (with minor discrepancy)',

  // Witness Claim
  claim: `On Friday night around 11 PM, I was walking past the old warehouse on 5th Street when a tall man in a dark trench coat and fedora approached me, pulled out a knife, and demanded my wallet. I gave it to him and he ran away toward the river.`,

  // Video Evidence Analysis
  videoSource: 'CCTV_5thSt_2026-02-13.mp4',
  videoDuration: '3m 42s',
  keyDetections: [
    { time: '23:02:15', event: 'Person appears', details: 'object: trench coat, fedora' },
    { time: '23:02:30', event: 'Person approaches second individual', details: null },
    { time: '23:02:35', event: 'Arm extends, object detected: knife', details: '87% confidence' },
    { time: '23:02:40', event: 'Second individual hands over small object', details: null },
    { time: '23:02:45', event: 'First person flees frame', details: 'direction: east' },
  ],
  onScreenText: '"OLD WAREHOUSE" (visible at 23:02:10)',
  gpsMetadata: '40.7128° N, 74.0060° W (5th Street area)',
  speechTranscription: null,

  // Comparison Engine Analysis
  comparisons: [
    { label: 'Time Match', match: true, detail: '23:02 vs claimed "around 11 PM"' },
    { label: 'Location Match', match: true, detail: '"OLD WAREHOUSE" sign + GPS' },
    { label: 'Suspect Description', match: true, detail: 'trench coat + fedora' },
    { label: 'Weapon Match', match: true, detail: 'knife detected, confidence 87%' },
    { label: 'Event Sequence', match: true, detail: 'approach → demand → handover → flee' },
    { label: 'Escape Direction', match: false, detail: 'claimed "toward river" — video shows east; river is west' },
  ],

  // Verdict Recommendation
  recommendations: [
    'Proceed with investigation.',
    'Note: Escape direction mismatch — witness may be disoriented or river reference was general. Verify with other cameras.',
  ],

  // Evidence Summary
  evidenceSummary: [
    'Suspect: Male, tall, trench coat, fedora',
    'Weapon: Knife (confirmed by video)',
    'Location: Old Warehouse, 5th Street (confirmed)',
    'Time: ~11:02 PM (within claimed window)',
    'Stolen item: Wallet (assumed; video shows handover)',
    'Discrepancy: Escape direction (east vs. claimed river)',
  ],
  detectiveQuote: `"The video don't lie, but witnesses get rattled. Check the east alley cams — our perp might've doubled back."`,

  // Footer
  filedBy: 'Detective Veritas',
  tagline: '"In the city of lies, trust the footage."',
};

export const MOCK_CONTRADICTED_CASE = {
  caseId: '2026-02-14-042',
  caseTitle: 'The Fedora Frame',
  verdict: 'contradicted',
  credibilityScore: 12,
  statusLabel: 'CLAIM CONTRADICTED — LIKELY FALSE REPORT',

  // Witness Claim
  claim: `I was attacked outside the Blue Note Jazz Club around midnight. A guy in a long coat and fedora grabbed my necklace and punched me in the face. I fought back but he ran off with my gold chain. I want him caught.`,

  // Video Evidence Analysis
  videoSource: 'BlueNote_CCTV_2026-02-14.mp4',
  videoDuration: '2m 18s',
  keyDetections: [
    { time: '23:58:00', event: 'Two individuals talking calmly near entrance', details: 'objects: both in casual jackets, no coats' },
    { time: '23:58:30', event: 'One person hands something to the other', details: 'object: small shiny item, possibly jewelry' },
    { time: '23:58:45', event: 'Both walk away in opposite directions, smiling', details: null },
    { time: '23:59:00', event: 'Club sign visible: "BLUE NOTE JAZZ CLUB"', details: null },
  ],
  onScreenText: null,
  gpsMetadata: '40.7306° N, 73.9989° W (verified club location)',
  speechTranscription: [
    { speaker: 'Person A', text: 'Thanks for the cash, see you tomorrow.' },
    { speaker: 'Person B', text: "Yeah, deal's done." },
  ],

  // Comparison Engine Analysis
  comparisons: [
    { label: 'Time Match', match: false, detail: 'claimed "midnight" — video ends at 23:59' },
    { label: 'Location Match', match: true, detail: 'Blue Note Jazz Club' },
    { label: 'Suspect Description', match: false, detail: 'no trench coat or fedora' },
    { label: 'Assault Claim', match: false, detail: 'no aggression, no punching' },
    { label: 'Robbery Claim', match: false, detail: 'exchange appears consensual' },
    { label: 'Emotional State', match: false, detail: 'both smiling, calm' },
    { label: 'Audio Contradiction', match: false, detail: 'conversation mentions cash deal' },
  ],

  // Verdict Recommendation
  recommendations: [
    'Do NOT proceed with robbery investigation.',
    'Flag witness for potential false reporting / insurance fraud.',
    'Consider interviewing both parties for possible collusion.',
  ],

  // Evidence Summary
  evidenceSummary: [
    'Suspect: None matching description (video shows casual wear)',
    'Assault: No evidence of violence',
    'Robbery: Exchange appears consensual (cash for item?)',
    'Time discrepancy: Claim says midnight, video ends before',
    'Audio: "deal\'s done" contradicts "snatched necklace"',
  ],
  detectiveQuote: `"The dame's singing a different tune than the tape. No coat, no punch, no crime — just a deal gone smooth. Someone's trying to pull a fast one. Case closed."`,

  // Footer
  filedBy: 'Detective Veritas',
  tagline: `"When the story don't match the screen, someone's lying."`,
};

export const MOCK_PAST_CASES = [
  { id: '2026-02-14-042', title: 'The Fedora Frame', date: '2026-02-14', verdict: 'contradicted', snippet: 'Blue Note Jazz Club attack claim...' },
  { id: '2026-02-14-001', title: 'The Whiskey Verdict', date: '2026-02-13', verdict: 'supported', snippet: '5th Street warehouse robbery witness...' },
  { id: '2026-02-12-018', title: 'The Alley Alibi', date: '2026-02-12', verdict: 'contradicted', snippet: 'Parking garage insurance claim...' },
  { id: '2026-02-10-007', title: 'The Midnight Run', date: '2026-02-10', verdict: 'supported', snippet: 'Warehouse break-in security report...' },
  { id: '2026-02-07-033', title: 'The ATM Phantom', date: '2026-02-07', verdict: 'supported', snippet: 'Disputed ATM withdrawal footage...' },
];

export const MOCK_CHAT_RESPONSES = {
  default: 'Based on the evidence analysis, I can provide further details. What specific aspect of the case would you like me to examine?',
  responses: [
    { keywords: ['when', 'time', 'enter'], response: 'According to the surveillance footage, the subject first enters the frame at the timestamp indicated in the evidence timeline above. The exact entry time is logged with millisecond precision from the camera\'s internal clock, which was verified against NTP sync records.' },
    { keywords: ['leave', 'exit', 'depart'], response: 'The footage shows the subject exiting the premises at the timestamp marked in the timeline. Notably, the exit path and door used may differ from what was stated in the original claim — refer to the comparison analysis for specifics.' },
    { keywords: ['who', 'person', 'identity'], response: 'Based on the video analysis, I can describe the physical characteristics observed but cannot make a definitive identification. The subject appears to match the general description provided. Facial recognition analysis would require a separate specialized request.' },
    { keywords: ['reliable', 'trust', 'credibility'], response: 'The credibility score is computed by comparing each distinct claim element against observable video evidence. Each matching element raises the score, while contradictions lower it proportionally to the significance of the discrepancy. The current score reflects the overall alignment between statement and footage.' },
  ],
};
