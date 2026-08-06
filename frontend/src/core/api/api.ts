const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Small wrapper over native fetch: sets JSON headers, attaches the Bearer token
// when given, and turns a non-2xx response into a thrown Error with the server
// message. No axios: fetch plus a few lines does the job.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
