/**
 * Minimal NoirVision backend API client.
 * Use from React or any JS: submit analyze job, poll status, fetch evidence pack.
 */

const defaultBase = typeof window !== "undefined" ? "" : "http://localhost:8000";

/**
 * @param {{ projectId: string, claim: string, youtubeUrl?: string, s3Key?: string }} opts
 * @param {string} [baseUrl]
 * @returns {Promise<{ jobId: string, status: string }>}
 */
export async function submitAnalyze(opts, baseUrl = defaultBase) {
  const { projectId, claim, youtubeUrl, s3Key } = opts;
  if (!projectId || !claim) throw new Error("projectId and claim required");
  if ((youtubeUrl && s3Key) || (!youtubeUrl && !s3Key))
    throw new Error("Provide exactly one of youtubeUrl or s3Key");

  const body = { project_id: projectId, claim };
  if (youtubeUrl) body.youtube_url = youtubeUrl;
  if (s3Key) body.s3_key = s3Key;

  const r = await fetch(`${baseUrl}/api/videos/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || "Submit failed");
  }
  const data = await r.json();
  return { jobId: data.job_id, status: data.status };
}

/**
 * @param {string} jobId
 * @param {string} [baseUrl]
 * @returns {Promise<{ jobId: string, status: string, videoId?: string, error?: string }>}
 */
export async function getJobStatus(jobId, baseUrl = defaultBase) {
  const r = await fetch(`${baseUrl}/api/videos/analyze/${jobId}`);
  if (!r.ok) {
    if (r.status === 404) throw new Error("Job not found");
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || "Status failed");
  }
  const data = await r.json();
  return {
    jobId: data.job_id,
    status: data.status,
    videoId: data.video_id ?? undefined,
    error: data.error ?? undefined,
  };
}

/**
 * Poll until job is done or failed.
 * @param {string} jobId
 * @param {{ intervalMs?: number, timeoutMs?: number, baseUrl?: string }} [opts]
 * @returns {Promise<{ videoId: string } | { error: string }>}
 */
export async function pollJobUntilDone(jobId, opts = {}) {
  const { intervalMs = 3000, timeoutMs = 600000, baseUrl = defaultBase } = opts;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await getJobStatus(jobId, baseUrl);
    if (status.status === "done" && status.videoId)
      return { videoId: status.videoId };
    if (status.status === "failed")
      return { error: status.error || "Job failed" };
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { error: "Poll timeout" };
}

/**
 * @param {string} videoId
 * @param {{ projectId?: string, baseUrl?: string }} [opts]
 * @returns {Promise<import('./types').EvidencePack>}
 */
export async function getEvidencePack(videoId, opts = {}) {
  const { projectId, baseUrl = defaultBase } = opts;
  const url = new URL(`${baseUrl}/api/videos/${videoId}/evidence`);
  if (projectId) url.searchParams.set("project_id", projectId);
  const r = await fetch(url.toString());
  if (!r.ok) {
    if (r.status === 404) throw new Error("Evidence not found");
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || "Evidence fetch failed");
  }
  return r.json();
}
