# NoirVision API client

Minimal client for the NoirVision backend (submit job, poll status, fetch evidence pack).

- **noirvision.js** — `submitAnalyze`, `getJobStatus`, `pollJobUntilDone`, `getEvidencePack`
- **types.d.ts** — `EvidencePack` type for TypeScript

Usage (React or any JS):

```js
import { submitAnalyze, pollJobUntilDone, getEvidencePack } from "./api/noirvision";

const { jobId } = await submitAnalyze({
  projectId: "proj-1",
  claim: "The speaker says X.",
  youtubeUrl: "https://www.youtube.com/watch?v=...",
});
const result = await pollJobUntilDone(jobId, { intervalMs: 3000 });
if ("videoId" in result) {
  const pack = await getEvidencePack(result.videoId, { projectId: "proj-1" });
  console.log(pack.transcript, pack.chapters);
}
```

Set `baseUrl` (e.g. `http://localhost:8000`) when the frontend is not served from the same host as the API.
