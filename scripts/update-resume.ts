// Refreshes the stored copy of the resume, used when the gist cannot be reached during a build.
//   yarn update-resume
import { writeFile } from 'node:fs/promises';
import { RESUME_FALLBACK, RESUME_URL } from '../src/lib/resume-source.ts';

const response = await fetch(RESUME_URL, { signal: AbortSignal.timeout(15_000) });
if (!response.ok) {
  console.error(`Could not fetch the resume: ${response.status} ${response.statusText}`);
  process.exit(1);
}
// Saved exactly as the gist has it, so a diff only shows real changes. Parsing first stops a broken file being saved.
const text = await response.text();
JSON.parse(text);
await writeFile(RESUME_FALLBACK, text);
console.log(`Updated ${RESUME_FALLBACK}`);
