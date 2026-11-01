import { getEntry, type CollectionEntry } from 'astro:content';

export type Resume = CollectionEntry<'resume'>['data'];
type Job = Resume['work'][number];

export async function getResume(): Promise<Resume> {
  const entry = await getEntry('resume', 'resume');
  if (!entry) throw new Error('Resume data did not load');
  return entry.data;
}

const parts = (date: string) => {
  const [year, month] = date.split('-').map(Number);
  return { year, month };
};

function formatPoint(date: string): string {
  const { year, month } = parts(date);
  if (!month) return String(year);
  return new Date(Date.UTC(year, month - 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatRange(start: string, end?: string): string {
  return `${formatPoint(start)} to ${end ? formatPoint(end) : 'present'}`;
}

export function formatDuration(start: string, end?: string): string {
  const from = parts(start);
  const now = new Date();
  const to = end ? parts(end) : { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const total = (to.year - from.year) * 12 + (to.month ?? 1) - (from.month ?? 1);
  const years = Math.floor(total / 12);
  const months = total % 12;
  const label = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  return [years && label(years, 'year'), months && label(months, 'month')].filter(Boolean).join(' ') || 'Under a month';
}

export interface Company {
  name: string;
  url?: string;
  image?: string;
  location?: string;
  keywords: string[];
  startDate: string;
  endDate?: string;
  roles: Job[];
}

// Several roles at one company share a single heading. Jobs are listed newest first.
export function groupByCompany(work: Job[]): Company[] {
  const companies = new Map<string, Company>();
  for (const job of work) {
    const company = companies.get(job.name);
    if (company) {
      company.roles.push(job);
      company.startDate = job.startDate;
      company.keywords = [...new Set([...company.keywords, ...job.keywords])];
    } else {
      companies.set(job.name, {
        name: job.name,
        url: job.url,
        image: job.image,
        location: job.location,
        keywords: job.keywords,
        startDate: job.startDate,
        endDate: job.endDate,
        roles: [job],
      });
    }
  }
  return [...companies.values()];
}
