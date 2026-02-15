/** Evidence pack returned by GET /api/videos/{video_id}/evidence */
export interface EvidencePack {
  video_id: string;
  source: { type: "youtube" | "s3"; url: string };
  transcript: string;
  chapters: Array<{ start: number; end: number; summary: string }>;
  events: Array<{
    t: number;
    type: "action" | "object" | "speech" | "scene";
    label: string;
    evidence: string;
  }>;
  key_quotes: Array<{ t: number; text: string }>;
  created_at: string;
  model_provider: string;
  raw_twelvelabs?: Record<string, unknown>;
}
