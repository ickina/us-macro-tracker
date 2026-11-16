import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadTypeScriptModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
}

const employmentModule = await loadTypeScriptModule('../src/lib/employmentStory.ts');
const inflationModule = await loadTypeScriptModule('../src/lib/inflationStory.ts');
const rateCutModule = await loadTypeScriptModule('../src/lib/rateCutView.ts');
const macroData = JSON.parse(await readFile(new URL('../src/data/macroData.json', import.meta.url), 'utf8'));

const {
  buildEmploymentStory,
  createEmploymentStoryVersion,
} = employmentModule;
const {
  buildInflationStory,
  createInflationStoryVersion,
} = inflationModule;
const { buildRateCutView } = rateCutModule;

const referenceDate = '2026-11-15';
const series = (seriesId, values) => ({
  seriesId,
  observations: values.map(([date, value]) => ({ date, value: String(value) })),
});

const employmentFixture = (direction = 'strong') => direction === 'strong' ? {
  PAYEMS: series('PAYEMS', [['2026-08-01', 100], ['2026-09-01', 110], ['2026-10-01', 125]]),
  ICSA: series('ICSA', [['2026-10-10', 230], ['2026-10-17', 220], ['2026-10-24', 210], ['2026-10-31', 200], ['2026-11-07', 190]]),
  UNRATE: series('UNRATE', [['2026-09-01', 4.2], ['2026-10-01', 4.1]]),
} : {
  PAYEMS: series('PAYEMS', [['2026-08-01', 125], ['2026-09-01', 110], ['2026-10-01', 90]]),
  ICSA: series('ICSA', [['2026-10-10', 190], ['2026-10-17', 200], ['2026-10-24', 210], ['2026-10-31', 220], ['2026-11-07', 230]]),
  UNRATE: series('UNRATE', [['2026-09-01', 4.1], ['2026-10-01', 4.2]]),
};

const inflationFixture = (direction = 'cooling') => direction === 'cooling' ? {
  CPIAUCSL: series('CPIAUCSL', [['2026-08-01', 3.2], ['2026-09-01', 3.0], ['2026-10-01', 2.8]]),
  CPILFESL: series('CPILFESL', [['2026-08-01', 3.1], ['2026-09-01', 3.0], ['2026-10-01', 2.9]]),
  PCEPILFE: series('PCEPILFE', [['2026-08-01', 2.9], ['2026-09-01', 2.8], ['2026-10-01', 2.7]]),
} : {
  CPIAUCSL: series('CPIAUCSL', [['2026-08-01', 2.8], ['2026-09-01', 3.0], ['2026-10-01', 3.2]]),
  CPILFESL: series('CPILFESL', [['2026-08-01', 2.7], ['2026-09-01', 2.8], ['2026-10-01', 2.9]]),
  PCEPILFE: series('PCEPILFE', [['2026-08-01', 2.6], ['2026-09-01', 2.7], ['2026-10-01', 2.8]]),
};

function assertRenderableStory(story) {
  assert.ok(['strong', 'weak', 'mixed', 'cooling', 'heating', 'hold'].includes(story.status));
  assert.ok(story.statusLabel.length > 0);
  assert.ok(story.summary.length > 0);
  assert.equal(story.sections.length, 4);
  for (const section of story.sections) {
    assert.ok(section.title.length > 0);
    assert.ok(section.description.length > 0);
    assert.ok(section.lines.length > 0);
    for (const line of section.lines) {
      assert.ok(line.length > 0);
      assert.doesNotMatch(line, /(?:NaN|undefined|Infinity)/);
    }
  }
}

test('employment uses people and percentage points, and recalculates revised history', () => {
  const before = employmentFixture('strong');
  const revised = {
    ...before,
    PAYEMS: series('PAYEMS', [['2026-08-01', 100], ['2026-09-01', 112], ['2026-10-01', 125]]),
  };
  const beforeStory = buildEmploymentStory(before, referenceDate);
  const revisedStory = buildEmploymentStory(revised, referenceDate);

  assert.match(beforeStory.sections[0].lines[0], /15,000人増えました/);
  assert.match(beforeStory.sections[1].lines[2], /0\.1ポイント下がりました/);
  assert.notEqual(beforeStory.sections[0].lines[1], revisedStory.sections[0].lines[1]);
  assert.notEqual(createEmploymentStoryVersion(before), createEmploymentStoryVersion(revised));
});

test('inflation uses percentage-point changes and detects revisions', () => {
  const before = inflationFixture('cooling');
  const revised = {
    ...before,
    CPIAUCSL: series('CPIAUCSL', [['2026-08-01', 3.2], ['2026-09-01', 3.1], ['2026-10-01', 2.8]]),
  };
  const story = buildInflationStory(before, referenceDate);

  assert.match(story.sections[0].lines[0], /0\.2ポイント下がりました/);
  assert.notEqual(createInflationStoryVersion(before), createInflationStoryVersion(revised));
});

test('inflation text distinguishes all moving together from a mix with flat data', () => {
  const allCooling = buildInflationStory(inflationFixture('cooling'), referenceDate);
  const coolingAndFlat = buildInflationStory({
    ...inflationFixture('cooling'),
    CPILFESL: series('CPILFESL', [['2026-08-01', 3.0], ['2026-09-01', 3.0], ['2026-10-01', 3.0]]),
  }, referenceDate);

  assert.match(allCooling.summary, /3つの数字がそろって低下/);
  assert.match(coolingAndFlat.summary, /低下または横ばい/);
  assert.doesNotMatch(coolingAndFlat.summary, /3つの数字がそろって低下/);
});

test('missing, stale, future and mismatched periods remain material-waiting states', () => {
  const missingEmployment = buildEmploymentStory({ PAYEMS: employmentFixture().PAYEMS }, referenceDate);
  assert.equal(missingEmployment.status, 'hold');

  const mismatchedEmployment = buildEmploymentStory({
    ...employmentFixture(),
    UNRATE: series('UNRATE', [['2026-08-01', 4.2], ['2026-09-01', 4.1]]),
  }, referenceDate);
  assert.equal(mismatchedEmployment.status, 'hold');
  assert.match(mismatchedEmployment.cautions.join(' '), /対象月がそろっていません/);

  const futureInflation = buildInflationStory({
    CPIAUCSL: series('CPIAUCSL', [['2026-11-01', 3.0], ['2026-12-01', 2.9]]),
    CPILFESL: series('CPILFESL', [['2026-11-01', 3.0], ['2026-12-01', 2.9]]),
    PCEPILFE: series('PCEPILFE', [['2026-11-01', 3.0], ['2026-12-01', 2.9]]),
  }, referenceDate);
  assert.equal(futureInflation.status, 'hold');
  assert.match(futureInflation.cautions.join(' '), /確認基準日より後/);

  const staleInflation = buildInflationStory({
    CPIAUCSL: series('CPIAUCSL', [['2026-05-01', 3.0], ['2026-06-01', 2.9]]),
    CPILFESL: series('CPILFESL', [['2026-05-01', 3.0], ['2026-06-01', 2.9]]),
    PCEPILFE: series('PCEPILFE', [['2026-05-01', 3.0], ['2026-06-01', 2.9]]),
  }, referenceDate);
  assert.equal(staleInflation.status, 'hold');
  assert.match(staleInflation.cautions.join(' '), /鮮度基準/);
});

test('rate-cut view covers tailwind, headwind, tug-of-war and hold without prediction', () => {
  const strong = buildEmploymentStory(employmentFixture('strong'), referenceDate);
  const weak = buildEmploymentStory(employmentFixture('weak'), referenceDate);
  const cooling = buildInflationStory(inflationFixture('cooling'), referenceDate);
  const heating = buildInflationStory(inflationFixture('heating'), referenceDate);
  const hold = buildInflationStory({}, referenceDate);

  assert.equal(buildRateCutView(weak, cooling).status, 'tailwind');
  assert.equal(buildRateCutView(strong, heating).status, 'headwind');
  assert.equal(buildRateCutView(strong, cooling).status, 'tug');
  assert.equal(buildRateCutView(strong, hold).status, 'hold');
  for (const result of [
    buildRateCutView(weak, cooling),
    buildRateCutView(strong, heating),
    buildRateCutView(strong, cooling),
    buildRateCutView(strong, hold),
  ]) {
    assert.match(result.checkNote, /金利先物などで確認/);
    assert.doesNotMatch(`${result.summary} ${result.checkNote}`, /明日|必ず|売買|買う|売る/);
  }
});

test('notification versions ignore unrelated data but detect relevant latest windows', () => {
  const employment = employmentFixture();
  const inflation = inflationFixture();
  const employmentVersion = createEmploymentStoryVersion(employment);
  const inflationVersion = createInflationStoryVersion(inflation);

  assert.equal(createEmploymentStoryVersion({ ...employment, SP500: series('SP500', [['2026-11-01', 1]]) }), employmentVersion);
  assert.equal(createInflationStoryVersion({ ...inflation, SP500: series('SP500', [['2026-11-01', 1]]) }), inflationVersion);
  assert.notEqual(createEmploymentStoryVersion({
    ...employment,
    ICSA: series('ICSA', [['2026-10-10', 230], ['2026-10-17', 220], ['2026-10-24', 210], ['2026-10-31', 200], ['2026-11-07', 191]]),
  }), employmentVersion);
});

test('impossible calendar dates are excluded instead of entering the story', () => {
  const invalidEmployment = {
    ...employmentFixture(),
    UNRATE: series('UNRATE', [['2026-09-01', 4.2], ['2026-10-01', 4.1], ['2026-02-30', 1.0]]),
  };
  const invalidInflation = {
    ...inflationFixture(),
    CPIAUCSL: series('CPIAUCSL', [['2026-09-01', 3.0], ['2026-10-01', 2.8], ['2026-02-30', 99]]),
  };

  assert.equal(buildEmploymentStory(invalidEmployment, referenceDate).dataDates.unemployment, '2026-10-01');
  assert.equal(buildInflationStory(invalidInflation, referenceDate).dataDates.headlineCpi, '2026-10-01');
});

test('the saved production snapshot always generates complete, deterministic text', () => {
  const data = macroData.indicators;
  const todayInJapan = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  assert.equal(Object.keys(data).length, 41);
  assert.ok(createEmploymentStoryVersion(data));
  assert.ok(createInflationStoryVersion(data));

  const employment = buildEmploymentStory(data, todayInJapan);
  const inflation = buildInflationStory(data, todayInJapan);
  assertRenderableStory(employment);
  assertRenderableStory(inflation);
  assert.deepEqual(buildEmploymentStory(data, todayInJapan), employment);
  assert.deepEqual(buildInflationStory(data, todayInJapan), inflation);

  const rateCut = buildRateCutView(employment, inflation);
  assert.ok(['tailwind', 'headwind', 'tug', 'hold'].includes(rateCut.status));
  assert.ok(rateCut.summary.length > 0);
  assert.match(rateCut.checkNote, /金利先物などで確認/);
});
