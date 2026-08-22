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
  const res = await request(path, options, token);
  // A 204 (a DELETE, say) carries no body to parse.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Downloads a file the API guards behind the token — the CSV export today. A plain
 * `<a href>` cannot carry an Authorization header, so the response is fetched, held
 * as a `Blob` and handed to a link that is clicked and thrown away.
 *
 * The name comes from `Content-Disposition`, which the API sets and CORS exposes, so
 * it stays defined in one place; `fallback` covers a proxy that strips the header.
 *
 * @throws When the response is not 2xx.
 */
export async function apiDownload(
  path: string,
  fallback: string,
  token?: string,
): Promise<void> {
  const res = await request(path, {}, token);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download =
    /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? fallback;
  // In the document and revoked a tick later: a detached link does not download in
  // every browser, and an object URL revoked in the same task can outrun the save.
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url));
}

/** The shared half: headers, the request itself, and a non-2xx turned into an Error. */
async function request(
  path: string,
  options: RequestInit,
  token?: string,
): Promise<Response> {
  const headers = new Headers(options.headers);
  // Only when the caller has not set one: the CSV import sends the file as `text/csv`.
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res;
}
