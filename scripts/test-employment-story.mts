import assert from 'node:assert/strict';
import macroData from '../src/data/macroData.json' with { type: 'json' };
// @ts-expect-error Node's built-in type stripping requires the explicit extension for this standalone check.
import { buildEmploymentStory, createEmploymentStoryVersion } from '../src/lib/employmentStory.ts';
import type { FredSeriesData } from '../src/lib/fred';

const referenceDate = '2026-11-14';
const series = (seriesId: string, values: Array<[string, number]>): FredSeriesData => ({
  seriesId,
  observations: values.map(([date, value]) => ({ date, value: String(value) })),
});

const fixture = (overrides: Partial<Record<'PAYEMS' | 'ICSA' | 'UNRATE', FredSeriesData>> = {}) => ({
  PAYEMS: series('PAYEMS', [['2026-08-01', 100], ['2026-09-01', 110], ['2026-10-01', 125]]),
  ICSA: series('ICSA', [['2026-10-10', 230], ['2026-10-17', 220], ['2026-10-24', 210], ['2026-10-31', 200], ['2026-11-07', 190]]),
  UNRATE: series('UNRATE', [['2026-09-01', 4.2], ['2026-10-01', 4.1]]),
  ...overrides,
});

const strong = buildEmploymentStory(fixture(), referenceDate);
assert.equal(strong.status, 'strong');
assert.equal(strong.statusLabel, '雇用はまだ力強い');

const slowdown = buildEmploymentStory(fixture({
  PAYEMS: series('PAYEMS', [['2026-08-01', 100], ['2026-09-01', 120], ['2026-10-01', 125]]),
  ICSA: series('ICSA', [['2026-10-10', 200], ['2026-10-17', 202], ['2026-10-24', 204], ['2026-10-31', 206], ['2026-11-07', 208]]),
  UNRATE: series('UNRATE', [['2026-09-01', 4.1], ['2026-10-01', 4.1]]),
}), referenceDate);
assert.equal(slowdown.status, 'mixed');
assert.match(slowdown.sections[0].lines[1], /増加幅.*縮まりました/);
assert.match(slowdown.sections[2].lines[0], /増加中ですが、増加幅は縮小/);

const mixed = buildEmploymentStory(fixture({
  ICSA: series('ICSA', [['2026-10-10', 190], ['2026-10-17', 195], ['2026-10-24', 200], ['2026-10-31', 205], ['2026-11-07', 210]]),
}), referenceDate);
assert.equal(mixed.status, 'mixed');
assert.match(mixed.summary, /動きはそろっていません/);

const mismatched = buildEmploymentStory(fixture({
  UNRATE: series('UNRATE', [['2026-08-01', 4.2], ['2026-09-01', 4.1]]),
}), referenceDate);
assert.equal(mismatched.status, 'hold');
assert.match(mismatched.cautions.join(' '), /対象月がそろっていません/);

const missing = buildEmploymentStory({ PAYEMS: fixture().PAYEMS } as Record<string, FredSeriesData>, referenceDate);
assert.equal(missing.status, 'hold');
assert.match(missing.cautions.join(' '), /履歴が足りません/);

const stale = buildEmploymentStory(fixture({
  ICSA: series('ICSA', [['2026-08-08', 230], ['2026-08-15', 220], ['2026-08-22', 210], ['2026-08-29', 200], ['2026-09-05', 190]]),
}), referenceDate);
assert.equal(stale.status, 'hold');
assert.match(stale.cautions.join(' '), /鮮度基準/);

const beforeRevision = buildEmploymentStory(fixture(), referenceDate);
const afterRevision = buildEmploymentStory(fixture({
  PAYEMS: series('PAYEMS', [['2026-08-01', 100], ['2026-09-01', 112], ['2026-10-01', 125]]),
}), referenceDate);
assert.notEqual(beforeRevision.sections[0].lines[1], afterRevision.sections[0].lines[1]);
assert.match(afterRevision.sections[0].lines[1], /1,000人広がりました/);
assert.notEqual(createEmploymentStoryVersion(fixture()), createEmploymentStoryVersion(fixture({
  PAYEMS: series('PAYEMS', [['2026-08-01', 100], ['2026-09-01', 112], ['2026-10-01', 125]]),
})));

const actual = buildEmploymentStory((macroData as { indicators: Record<string, FredSeriesData> }).indicators, referenceDate);
assert.equal(actual.status, 'mixed');
assert.equal(actual.statusLabel, '強さの中に、少し揺れ');

console.log(JSON.stringify({
  cases: {
    strong: strong.statusLabel,
    slowdown: slowdown.statusLabel,
    mixed: mixed.statusLabel,
    periodMismatch: mismatched.statusLabel,
    missing: missing.statusLabel,
    stale: stale.statusLabel,
    revisionRecalculated: beforeRevision.sections[0].lines[1] !== afterRevision.sections[0].lines[1],
  },
  actual,
}, null, 2));

