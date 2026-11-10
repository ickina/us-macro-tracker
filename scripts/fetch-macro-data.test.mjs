import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { main, SERIES_CONFIG, validateSeries, fetchFredSeries } from './fetch-macro-data.mjs';

const oldSnapshot = {
  updatedAt: '2025-01-01T00:00:00.000Z',
  indicators: Object.fromEntries(SERIES_CONFIG.map(({ id }) => [id, {
    seriesId: id, observations: [{ date: '2025-01-01', value: '100' }]
  }])),
  news: [
    { id: 'old-frb', source: 'Federal Reserve Board (FRB)', title: 'Previous FRB news' },
    { id: 'old-cnbc', source: 'CNBC US Market', title: 'Previous CNBC news' }
  ]
};

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'macro-refresh-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const outPath = path.join(dir, 'macroData.json');
  fs.writeFileSync(outPath, JSON.stringify(oldSnapshot));
  const original = fs.readFileSync(outPath, 'utf8');
  return { outPath, original };
}

function mockSources(t, overrides = {}) {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'error', () => {});
  const warnings = [];
  t.mock.method(console, 'warn', message => warnings.push(message));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert(options.signal, 'Every network request must have a timeout');
    const u = new URL(url);
    if (u.hostname === 'fred.stlouisfed.org') {
      const id = u.searchParams.get('id');
      if (overrides.fred) return overrides.fred(id);
      return new Response(`observation_date,${id}\n2024-01-01,100\n2024-02-01,100\n2025-01-01,110\n2025-02-01,112\n`);
    }
    if (u.hostname === 'open.er-api.com') {
      return overrides.fx?.() ?? Response.json({ rates: { JPY: 150, EUR: 0.9 } });
    }
    if (u.hostname === 'www.federalreserve.gov') {
      return overrides.frb?.() ?? new Response('<rss><channel><item><title>FOMC statement</title><link>https://www.federalreserve.gov/press</link><pubDate>Thu, 01 Jan 2026 12:00:00 GMT</pubDate></item></channel></rss>');
    }
    if (u.hostname === 'www.cnbc.com') {
      return overrides.cnbc?.() ?? new Response('<rss><channel><item><title>Stock market news</title><description>Stock market update</description><link>https://www.cnbc.com/market</link><pubDate>Thu, 01 Jan 2026 12:00:00 GMT</pubDate></item></channel></rss>');
    }
    if (u.hostname === 'translate.googleapis.com') {
      return overrides.translate?.() ?? Response.json([[['日本語の市場ニュース']]]);
    }
    throw new Error(`Unexpected network destination: ${u.hostname}`);
  });
  return warnings;
}

test('successful refresh writes all 41 finite series and fresh news without changing calculations', async t => {
  const { outPath } = fixture(t);
  mockSources(t);
  const result = await main({ outPath });
  assert.equal(Object.keys(result.indicators).length, 41);
  for (const { id } of SERIES_CONFIG) validateSeries(result.indicators[id], id);
  assert.equal(result.indicators.CPIAUCSL.observations.at(-1).value, '12.00');
  assert.equal(result.indicators.RSAFS.observations.at(-1).value, '1.82');
  assert.equal(result.indicators.GDP.observations.at(-1).value, '7.47');
  assert.equal(result.news.length, 2);
  assert(!result.news.some(n => n.id.startsWith('old-')));
  assert.notEqual(result.updatedAt, oldSnapshot.updatedAt);
  assert.deepEqual(JSON.parse(fs.readFileSync(outPath, 'utf8')), result);
  assert.deepEqual(fs.readdirSync(path.dirname(outPath)).sort(), ['history', 'macroData.json']);
});

for (const [name, response] of [
  ['HTTP failure', () => new Response('unavailable', { status: 503 })],
  ['empty observations', () => new Response('observation_date,DGS10\n')],
  ['HTML returned as HTTP 200', () => new Response('<html>Access denied</html>')],
  ['malformed CSV row', () => new Response('observation_date,DGS10\n2025-01-01,1\nbroken row\n')],
  ['non-numeric value', () => new Response('observation_date,DGS10\n2025-01-01,NaN\n')],
  ['unsorted observations', () => new Response('observation_date,DGS10\n2025-02-01,2\n2025-01-01,1\n')],
  ['connection timeout', () => { throw new DOMException('Timed out', 'TimeoutError'); }]
]) {
  test(`${name}: one failed indicator leaves entire previous file and timestamp byte-for-byte unchanged`, async t => {
    const { outPath, original } = fixture(t);
    mockSources(t, { fred: id => id === 'DGS10' ? response() : new Response(`DATE,${id}\n2024-01-01,100\n2024-02-01,100\n2025-01-01,110\n2025-02-01,112\n`) });
    await assert.rejects(main({ outPath }), /Refresh cancelled.*DGS10/);
    assert.equal(fs.readFileSync(outPath, 'utf8'), original);
  });
}

test('all remote indicators fail: snapshot remains intact', async t => {
  const { outPath, original } = fixture(t);
  mockSources(t, { fred: () => new Response('denied', { status: 403 }) });
  await assert.rejects(main({ outPath }), /41 indicator\(s\) failed/);
  assert.equal(fs.readFileSync(outPath, 'utf8'), original);
});

test('empty FRB news retains only FRB records while CNBC and indicators refresh', async t => {
  const { outPath } = fixture(t);
  const warnings = mockSources(t, { frb: () => new Response('<rss><channel/></rss>') });
  const result = await main({ outPath });
  assert(result.news.some(n => n.id === 'old-frb'));
  assert(!result.news.some(n => n.id === 'old-cnbc'));
  assert(warnings.some(m => m.includes('retained 1')));
});

test('translation failure retains CNBC records and emits a GitHub warning', async t => {
  const { outPath } = fixture(t);
  const prior = process.env.GITHUB_ACTIONS;
  process.env.GITHUB_ACTIONS = 'true';
  t.after(() => { if (prior === undefined) delete process.env.GITHUB_ACTIONS; else process.env.GITHUB_ACTIONS = prior; });
  const warnings = mockSources(t, { translate: () => new Response('failed', { status: 503 }) });
  const result = await main({ outPath });
  assert(result.news.some(n => n.id === 'old-cnbc'));
  assert(!result.news.some(n => n.id === 'old-frb'));
  assert(warnings.some(m => m.startsWith('::warning::') && m.includes('CNBC')));
});

test('both news feeds fail: all old news remains available', async t => {
  const { outPath } = fixture(t);
  mockSources(t, { frb: () => new Response('', { status: 503 }), cnbc: () => new Response('', { status: 503 }) });
  const result = await main({ outPath });
  assert.deepEqual(new Set(result.news.map(n => n.id)), new Set(['old-frb', 'old-cnbc']));
});

test('invalid optional FX response cannot damage validated FRED values', async t => {
  const { outPath } = fixture(t);
  const warnings = mockSources(t, { fx: () => Response.json({ rates: { JPY: null, EUR: 0 } }) });
  const result = await main({ outPath });
  assert.equal(result.indicators.DEXJPUS.observations.at(-1).value, '112');
  assert(warnings.some(m => m.includes('FX supplement skipped')));
});

test('unreadable previous snapshot fails before making requests', async t => {
  const { outPath } = fixture(t);
  fs.writeFileSync(outPath, '{corrupt');
  mockSources(t);
  await assert.rejects(main({ outPath }), SyntaxError);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
  assert.equal(fs.readFileSync(outPath, 'utf8'), '{corrupt');
});

test('interrupted atomic save preserves original and cleans temporary file', async t => {
  const { outPath, original } = fixture(t);
  mockSources(t);
  t.mock.method(fs, 'renameSync', () => { throw new Error('disk failure'); });
  await assert.rejects(main({ outPath }), /disk failure/);
  assert.equal(fs.readFileSync(outPath, 'utf8'), original);
  assert.deepEqual(fs.readdirSync(path.dirname(outPath)).sort(), ['history', 'macroData.json']);
});

test('actual CLI exits nonzero on failure so Actions and builds cannot claim success', t => {
  const { outPath } = fixture(t);
  const dir = path.dirname(outPath);
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.mkdirSync(path.join(dir, 'src', 'data'), { recursive: true });
  fs.copyFileSync(new URL('./fetch-macro-data.mjs', import.meta.url), path.join(dir, 'scripts', 'fetch-macro-data.mjs'));
  const snapshot = path.join(dir, 'src', 'data', 'macroData.json');
  fs.writeFileSync(snapshot, JSON.stringify(oldSnapshot));
  const mockFile = path.join(dir, 'offline.mjs');
  fs.writeFileSync(mockFile, "globalThis.fetch = async () => new Response('blocked', { status: 403 });");
  const result = spawnSync(process.execPath, ['--import', mockFile, path.join(dir, 'scripts', 'fetch-macro-data.mjs')], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refresh cancelled/);
  assert.deepEqual(JSON.parse(fs.readFileSync(snapshot, 'utf8')), oldSnapshot);
});


test('daily dashboard stays at 300 observations while detailed history keeps older years', async t => {
  const { outPath } = fixture(t);
  const lines = Array.from({ length: 2200 }, (_, i) => `${new Date(Date.UTC(2020, 0, i + 1)).toISOString().slice(0, 10)},${100 + i}`);
  mockSources(t, { fred: id => new Response(`observation_date,${id}\n${lines.join('\n')}\n`) });
  const result = await main({ outPath });
  assert.equal(result.indicators.SP500.observations.length, 300);
  const history = JSON.parse(fs.readFileSync(path.join(path.dirname(outPath), 'history', 'SP500.json'), 'utf8'));
  assert.equal(history.observations.length, 2200);
  assert.equal(history.observations[0].date, '2020-01-01');
  const limited = await fetchFredSeries({ id: 'SP500', freq: 'daily' });
  assert.equal(limited.observations.length, 300);
});

test('required fetch failure also preserves previously published long history', async t => {
  const { outPath } = fixture(t);
  const dir = path.join(path.dirname(outPath), 'history');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'SP500.json'), 'previous history');
  mockSources(t, { fred: () => new Response('', { status: 503 }) });
  await assert.rejects(main({ outPath }), /Refresh cancelled/);
  assert.equal(fs.readFileSync(path.join(dir, 'SP500.json'), 'utf8'), 'previous history');
});
