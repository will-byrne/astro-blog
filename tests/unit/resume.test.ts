import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', () => ({ getEntry: vi.fn() }));

const { formatDuration, formatRange, groupByCompany } = await import('../../src/lib/resume');

type Job = Parameters<typeof groupByCompany>[0][number];

const job = (overrides: Partial<Job>): Job => ({
  name: 'Acme',
  position: 'Developer',
  startDate: '2020-01',
  highlights: [],
  keywords: [],
  ...overrides,
});

describe('formatRange', () => {
  it('shows month and year', () => {
    expect(formatRange('2020-03', '2022-11')).toBe('Mar 2020 to Nov 2022');
  });

  it('accepts full dates and ignores the day', () => {
    expect(formatRange('2020-03-15', '2022-11-01')).toBe('Mar 2020 to Nov 2022');
  });

  it('shows just the year when there is no month', () => {
    expect(formatRange('2015', '2018')).toBe('2015 to 2018');
  });

  it('says present when there is no end date', () => {
    expect(formatRange('2023-06')).toBe('Jun 2023 to present');
  });
});

describe('formatDuration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['2020-01', '2022-04', '2 years 3 months'],
    ['2020-01', '2021-02', '1 year 1 month'],
    ['2020-01', '2023-01', '3 years'],
    ['2020-01', '2020-07', '6 months'],
    ['2020-01', '2020-01', 'Under a month'],
    ['2015', '2018', '3 years'],
  ])('%s to %s is %s', (start, end, expected) => {
    expect(formatDuration(start, end)).toBe(expected);
  });

  it('counts up to the current month when there is no end date', () => {
    expect(formatDuration('2024-08')).toBe('2 years 3 months');
  });
});

describe('groupByCompany', () => {
  it('puts several roles at one company under one heading', () => {
    const senior = job({ position: 'Senior', startDate: '2022-01', endDate: '2024-01', keywords: ['TypeScript'] });
    const junior = job({ position: 'Junior', startDate: '2019-06', endDate: '2022-01', keywords: ['JavaScript', 'TypeScript'] });
    const [company] = groupByCompany([senior, junior]);

    expect(company.roles).toEqual([senior, junior]);
    // The range runs from the oldest role's start to the newest role's end
    expect(company.startDate).toBe('2019-06');
    expect(company.endDate).toBe('2024-01');
    expect(company.keywords).toEqual(['TypeScript', 'JavaScript']);
  });

  it('keeps different companies apart and in order', () => {
    const companies = groupByCompany([job({ name: 'Newer' }), job({ name: 'Older' })]);
    expect(companies.map((c) => c.name)).toEqual(['Newer', 'Older']);
  });

  it('carries over the company details from the newest role', () => {
    const [company] = groupByCompany([job({ url: 'https://acme.test', image: 'acme.png', location: 'Leeds' })]);
    expect(company).toMatchObject({ url: 'https://acme.test', image: 'acme.png', location: 'Leeds' });
  });

  it('returns nothing for no work', () => {
    expect(groupByCompany([])).toEqual([]);
  });
});
