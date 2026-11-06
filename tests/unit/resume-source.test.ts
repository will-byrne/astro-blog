import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadResume } from '../../src/lib/resume-source';

let dir: string;
let fallback: string;
const live = { basics: { name: 'Live' } };
const stored = { basics: { name: 'Stored' } };

beforeEach(() => {
  // CI sets RESUME_FILE for the build; these tests need the network path, so clear it
  vi.stubEnv('RESUME_FILE', '');
  dir = mkdtempSync(join(tmpdir(), 'resume-'));
  fallback = join(dir, 'resume.json');
  writeFileSync(fallback, JSON.stringify(stored));
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

const respond = (body: unknown, init: ResponseInit = {}) => vi.fn(async () => new Response(JSON.stringify(body), init));

describe('loadResume', () => {
  it('uses the live resume when the gist answers', async () => {
    const warn = vi.fn();
    expect(await loadResume({ file: undefined, fallback, fetch: respond(live), warn })).toEqual(live);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['the gist returns an error', respond('nope', { status: 503, statusText: 'Service Unavailable' }), /503 Service Unavailable/],
    ['the network is down', vi.fn(async () => { throw new TypeError('fetch failed'); }), /fetch failed/],
    ['the response is not JSON', vi.fn(async () => new Response('<html>')), /Could not fetch/],
    ['the response is not a resume object', respond([1, 2, 3]), /not a resume object/],
  ])('falls back to the stored copy, with a warning, when %s', async (_, fetchFn, reason) => {
    const warn = vi.fn();
    expect(await loadResume({ file: undefined, fallback, fetch: fetchFn as typeof fetch, warn })).toEqual(stored);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(reason);
    expect(warn.mock.calls[0][0]).toContain(fallback);
  });

  it('gives up on a slow gist after the timeout', async () => {
    const hang = vi.fn((_url: string, { signal }: RequestInit) => new Promise<Response>((_, reject) => signal!.addEventListener('abort', () => reject(signal!.reason))));
    const warn = vi.fn();
    const started = Date.now();
    expect(await loadResume({ file: undefined, fallback, fetch: hang as unknown as typeof fetch, warn, timeoutMs: 50 })).toEqual(stored);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('reads the given file without touching the network', async () => {
    const fetchFn = vi.fn();
    expect(await loadResume({ file: fallback, fetch: fetchFn })).toEqual(stored);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('fails if the gist is down and there is no stored copy either', async () => {
    const down = vi.fn(async () => { throw new TypeError('fetch failed'); });
    await expect(loadResume({ file: undefined, fallback: join(dir, 'missing.json'), fetch: down, warn: vi.fn() })).rejects.toThrow(/ENOENT/);
  });
});
