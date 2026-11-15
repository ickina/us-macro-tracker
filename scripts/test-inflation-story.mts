import assert from 'node:assert/strict';
import macroData from '../src/data/macroData.json' with { type: 'json' };
// @ts-expect-error Node's built-in type stripping requires the explicit extension for this standalone check.
import { buildEmploymentStory } from '../src/lib/employmentStory.ts';
// @ts-expect-error Node's built-in type stripping requires the explicit extension for this standalone check.
import { buildInflationStory, createInflationStoryVersion } from '../src/lib/inflationStory.ts';
// @ts-expect-error Node's built-in type stripping requires the explicit extension for this standalone check.
import { buildRateCutView } from '../src/lib/rateCutView.ts';
import type { FredSeriesData } from '../src/lib/fred';

const referenceDate = '2026-11-15';
const series = (seriesId: string, values: Array<[string, number]>): FredSeriesData => ({
  seriesId,
  observations: values.map(([date, value]) => ({ date, value: String(value) })),
});

const inflationFixture = (overrides: Partial<Record<'CPIAUCSL' | 'CPILFESL' | 'PCEPILFE', FredSeriesData>> = {}) => ({
  CPIAUCSL: series('CPIAUCSL', [['2026-08-01', 3.2], ['2026-09-01', 3.0], ['2026-10-01', 2.8]]),
  CPILFESL: series('CPILFESL', [['2026-08-01', 3.1], ['2026-09-01', 3.0], ['2026-10-01', 2.9]]),
  PCEPILFE: series('PCEPILFE', [['2026-08-01', 2.9], ['2026-09-01', 2.8], ['2026-10-01', 2.7]]),
  ...overrides,
});

const employmentFixture = (direction: 'strong' | 'weak') => direction === 'strong' ? {
  PAYEMS: series('PAYEMS', [['2026-08-01', 100], ['2026-09-01', 110], ['2026-10-01', 125]]),
  ICSA: series('ICSA', [['2026-10-10', 230], ['2026-10-17', 220], ['2026-10-24', 210], ['2026-10-31', 200], ['2026-11-07', 190]]),
  UNRATE: series('UNRATE', [['2026-09-01', 4.2], ['2026-10-01', 4.1]]),
} : {
  PAYEMS: series('PAYEMS', [['2026-08-01', 125], ['2026-09-01', 110], ['2026-10-01', 90]]),
  ICSA: series('ICSA', [['2026-10-10', 190], ['2026-10-17', 200], ['2026-10-24', 210], ['2026-10-31', 220], ['2026-11-07', 230]]),
  UNRATE: series('UNRATE', [['2026-09-01', 4.1], ['2026-10-01', 4.2]]),
};

const cooling = buildInflationStory(inflationFixture(), referenceDate);
assert.equal(cooling.status, 'cooling');
assert.equal(cooling.statusLabel, '物価は落ち着く方向');

const heatingData = inflationFixture({
  CPIAUCSL: series('CPIAUCSL', [['2026-08-01', 2.8], ['2026-09-01', 3.0], ['2026-10-01', 3.2]]),
  CPILFESL: series('CPILFESL', [['2026-08-01', 2.7], ['2026-09-01', 2.8], ['2026-10-01', 2.9]]),
  PCEPILFE: series('PCEPILFE', [['2026-08-01', 2.6], ['2026-09-01', 2.7], ['2026-10-01', 2.8]]),
});
const heating = buildInflationStory(heatingData, referenceDate);
assert.equal(heating.status, 'heating');
assert.equal(heating.statusLabel, '物価に再加速の気配');

const mixed = buildInflationStory(inflationFixture({
  CPILFESL: series('CPILFESL', [['2026-08-01', 2.8], ['2026-09-01', 2.9], ['2026-10-01', 3.0]]),
}), referenceDate);
assert.equal(mixed.status, 'mixed');

const mismatched = buildInflationStory(inflationFixture({
  PCEPILFE: series('PCEPILFE', [['2026-07-01', 2.9], ['2026-08-01', 2.8], ['2026-09-01', 2.7]]),
}), referenceDate);
assert.equal(mismatched.status, 'hold');
assert.match(mismatched.cautions.join(' '), /対象月がそろっていません/);

const missing = buildInflationStory({ CPIAUCSL: inflationFixture().CPIAUCSL } as Record<string, FredSeriesData>, referenceDate);
assert.equal(missing.status, 'hold');
assert.match(missing.cautions.join(' '), /履歴が足りません/);

const stale = buildInflationStory(inflationFixture({
  CPIAUCSL: series('CPIAUCSL', [['2026-05-01', 3.2], ['2026-06-01', 3.0], ['2026-07-01', 2.8]]),
  CPILFESL: series('CPILFESL', [['2026-05-01', 3.1], ['2026-06-01', 3.0], ['2026-07-01', 2.9]]),
  PCEPILFE: series('PCEPILFE', [['2026-05-01', 2.9], ['2026-06-01', 2.8], ['2026-07-01', 2.7]]),
}), referenceDate);
assert.equal(stale.status, 'hold');
assert.match(stale.cautions.join(' '), /鮮度基準/);

const revised = inflationFixture({
  CPIAUCSL: series('CPIAUCSL', [['2026-08-01', 3.2], ['2026-09-01', 3.1], ['2026-10-01', 2.8]]),
});
assert.notEqual(createInflationStoryVersion(inflationFixture()), createInflationStoryVersion(revised));

const strongEmployment = buildEmploymentStory(employmentFixture('strong'), referenceDate);
const weakEmployment = buildEmploymentStory(employmentFixture('weak'), referenceDate);
assert.equal(buildRateCutView(weakEmployment, cooling).status, 'tailwind');
assert.equal(buildRateCutView(strongEmployment, heating).status, 'headwind');
assert.equal(buildRateCutView(strongEmployment, cooling).status, 'tug');
assert.equal(buildRateCutView(strongEmployment, mismatched).status, 'hold');

const actualData = (macroData as { indicators: Record<string, FredSeriesData> }).indicators;
const actualInflation = buildInflationStory(actualData, referenceDate);
const actualEmployment = buildEmploymentStory(actualData, referenceDate);
const actualRateCut = buildRateCutView(actualEmployment, actualInflation);
assert.equal(actualInflation.status, 'heating');
assert.equal(actualRateCut.status, 'tug');

console.log(JSON.stringify({
  cases: {
    cooling: cooling.statusLabel,
    heating: heating.statusLabel,
    mixed: mixed.statusLabel,
    periodMismatch: mismatched.statusLabel,
    missing: missing.statusLabel,
    stale: stale.statusLabel,
    revisionRecalculated: createInflationStoryVersion(inflationFixture()) !== createInflationStoryVersion(revised),
    rateCutTailwind: buildRateCutView(weakEmployment, cooling).label,
    rateCutHeadwind: buildRateCutView(strongEmployment, heating).label,
    rateCutTug: buildRateCutView(strongEmployment, cooling).label,
    rateCutHold: buildRateCutView(strongEmployment, mismatched).label,
  },
  actual: { inflation: actualInflation, rateCut: actualRateCut },
}, null, 2));
