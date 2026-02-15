/**
 * NoirVision users/incidents API (DynamoDB-backed).
 * All calls require Authorization: Bearer <id_token>.
 */

const getBaseUrl = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000';

function authHeaders(idToken) {
  if (!idToken) throw new Error('id_token required');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  };
}

/**
 * @param {string} idToken - Cognito id_token
 * @returns {Promise<{ user_id: string, email: string, updated_at: string }>}
 */
export async function getProfile(idToken) {
  const r = await fetch(`${getBaseUrl()}/api/users/me/profile`, {
    headers: authHeaders(idToken),
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || 'Get profile failed');
  }
  return r.json();
}

/**
 * Create or update current user profile (e.g. on first login).
 * @param {string} idToken
 * @param {{ email?: string }} [body]
 */
export async function putProfile(idToken, body = {}) {
  const r = await fetch(`${getBaseUrl()}/api/users/me/profile`, {
    method: 'PUT',
    headers: authHeaders(idToken),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || 'Put profile failed');
  }
  return r.json();
}

/**
 * @param {string} idToken
 * @returns {Promise<Array<{ incident_id: string, incident_name: string, description: string, video_link: string, generated_text: string, created_at: string, updated_at: string }>>}
 */
export async function listIncidents(idToken) {
  const r = await fetch(`${getBaseUrl()}/api/users/me/incidents`, {
    headers: authHeaders(idToken),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || 'List incidents failed');
  }
  return r.json();
}

/**
 * @param {string} idToken
 * @param {string} incidentId
 */
export async function getIncident(idToken, incidentId) {
  const r = await fetch(`${getBaseUrl()}/api/users/me/incidents/${encodeURIComponent(incidentId)}`, {
    headers: authHeaders(idToken),
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || 'Get incident failed');
  }
  return r.json();
}

/**
 * Create incident. incident_id must be unique per user.
 * @param {string} idToken
 * @param {{ incident_id: string, incident_name: string, description?: string, video_link?: string, generated_text?: string }} body
 */
export async function createIncident(idToken, body) {
  const url = `${getBaseUrl()}/api/users/me/incidents`;
  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: authHeaders(idToken),
      body: JSON.stringify({
        incident_id: body.incident_id,
        incident_name: body.incident_name,
        description: body.description ?? '',
        video_link: body.video_link ?? '',
        generated_text: body.generated_text ?? '',
      }),
    });
  } catch (networkError) {
    const baseUrl = getBaseUrl();
    throw new Error(
      `Cannot reach backend at ${baseUrl}. Is the server running? (${networkError.message})`
    );
  }
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || 'Create incident failed');
  }
  return r.json();
}

/**
 * Update incident (e.g. generated_text when report is ready).
 * @param {string} idToken
 * @param {string} incidentId
 * @param {{ incident_name?: string, description?: string, video_link?: string, generated_text?: string }} body
 */
export async function updateIncident(idToken, incidentId, body) {
  const r = await fetch(`${getBaseUrl()}/api/users/me/incidents/${encodeURIComponent(incidentId)}`, {
    method: 'PATCH',
    headers: authHeaders(idToken),
    body: JSON.stringify(body),
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || 'Update incident failed');
  }
  return r.json();
}
