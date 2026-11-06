import { readFile } from 'node:fs/promises';

// The resume repo copies resume.json to this public gist on every push
export const RESUME_URL = 'https://gist.githubusercontent.com/will-byrne/b6c82ed9d60d9e11dda925d9bc924628/raw/resume.json';

// A stored copy, used when the gist cannot be reached so a deploy never fails because of it.
// Refresh it with `yarn update-resume`.
export const RESUME_FALLBACK = 'src/data/resume.json';

interface Options {
  url?: string;
  fallback?: string;
  /** Set to a file to skip the network entirely, as the tests and CI do */
  file?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  warn?: (message: string) => void;
}

const readJson = async (path: string) => JSON.parse(await readFile(path, 'utf8'));

export async function loadResume({
  url = RESUME_URL,
  fallback = RESUME_FALLBACK,
  file = process.env.RESUME_FILE,
  timeoutMs = 10_000,
  fetch: fetchFn = fetch,
  warn = (message) => console.warn(message),
}: Options = {}): Promise<Record<string, unknown>> {
  if (file) return readJson(file);

  try {
    // A slow gist should not hold up the build for long
    const response = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('the response was not a resume object');
    return data;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    warn(`[resume] Could not fetch the resume (${reason}). Using the stored copy in ${fallback}, which may be out of date.`);
    return readJson(fallback);
  }
}
