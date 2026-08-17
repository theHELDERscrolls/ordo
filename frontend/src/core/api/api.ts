const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Thin wrapper over `fetch`: sets the JSON headers, attaches the Bearer token when
 * given, and turns a non-2xx response into a thrown Error carrying the server's
 * message. Native fetch plus a few lines covers what the app needs from an HTTP
 * client, so there is no axios.
 *
 * @throws When the response is not 2xx.
 */
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
  // A 204 (a DELETE, say) carries no body to parse.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
