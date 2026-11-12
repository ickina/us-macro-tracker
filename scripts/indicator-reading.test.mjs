import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Test the presentation calculation without introducing a runtime dependency or changing data jobs.
const source = fs.readFileSync(new URL('../src/lib/indicatorReading.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { getIndicatorReading } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const point = (date, value) => ({ date, value: String(value) });

test('only the three approved indicators receive guidance', () => {
  assert.equal(getIndicatorReading('DEXJPUS', []), null);
  assert.equal(getIndicatorReading('SP500', []), null);
  assert.equal(getIndicatorReading('DGS2', []), null);
});
test('EUR/USD explains both directions and equal or missing comparisons', () => {
  assert.equal(getIndicatorReading('DEXUSEU', [point('2026-01-01', 1.1), point('2026-01-02', 1.2)]).direction, 'ユーロ高・ドル安方向');
  assert.equal(getIndicatorReading('DEXUSEU', [point('2026-01-01', 1.2), point('2026-01-02', 1.1)]).direction, 'ユーロ安・ドル高方向');
  assert.equal(getIndicatorReading('DEXUSEU', [point('2026-01-01', 1.1), point('2026-01-02', 1.1)]).direction, '前回と同じ交換レート');
  assert.equal(getIndicatorReading('DEXUSEU', [point('2026-01-02', 1.1)]).range, null);
});
test('broad dollar index is not described as DXY, and interest is not bond price', () => {
  const data = [point('2026-01-01', 4), point('2026-01-02', 5)];
  const dollar = getIndicatorReading('DTWEXBGS', data);
  assert.equal(dollar.direction, '幅広い通貨に対してドル高');
  assert.match(dollar.reading, /DXYとは別/);
  const yieldReading = getIndicatorReading('DGS10', data);
  assert.equal(yieldReading.direction, '米国の長期金利が上昇');
  assert.equal(yieldReading.unit, '％');
  assert.match(yieldReading.reading, /債券価格は下がる/);
});
test('the window ends on the data date, ignores older extrema and includes the cutoff', () => {
  const result = getIndicatorReading('DGS10', [point('2022-05-31', 99), point('2022-06-01', 2), point('2022-12-01', 6), point('2023-06-01', 4)]).range;
  assert.equal(result.start, '2022-06-01');
  assert.equal(result.end, '2023-06-01');
  assert.equal(result.min, 2);
  assert.equal(result.max, 6);
  assert.equal(result.position, 0.5);
  assert.equal(result.count, 3);
  assert.equal(result.fullYear, true);
  assert.equal(result.label, '中ほど');
});
test('position is min-to-max distance, not observation percentile', () => {
  const result = getIndicatorReading('DGS10', [point('2025-01-01', 0), point('2025-02-01', 1), point('2025-03-01', 2), point('2025-04-01', 100), point('2026-01-01', 10)]).range;
  assert.equal(result.position, 0.1);
  assert.equal(result.label, '低めの位置');
});
test('flat data has no misleading numeric meter or division by zero', () => {
  const result = getIndicatorReading('DGS10', [point('2025-01-01', 4), point('2026-01-01', 4)]).range;
  assert.equal(result.position, null);
  assert.equal(result.label, '期間中は同じ水準');
});
test('short history is explicitly distinguished from a full year', () => {
  const result = getIndicatorReading('DGS10', [point('2026-11-01', 4), point('2026-11-12', 5)]).range;
  assert.equal(result.fullYear, false);
  assert.equal(result.start, '2026-11-01');
  assert.equal(result.position, 1);
  assert.equal(result.label, '期間内の最高値');
});
test('invalid values and invalid calendar days are excluded, input remains unchanged', () => {
  const input = Object.freeze([Object.freeze(point('2026-01-03', 5)), Object.freeze(point('2025-01-03', 4)), Object.freeze(point('2026-02-30', 500)), Object.freeze(point('2025-09-01', '.')), Object.freeze(point('2025-10-01', '')), Object.freeze(point('2025-11-01', 'Infinity'))]);
  const result = getIndicatorReading('DGS10', input).range;
  assert.equal(result.count, 2);
  assert.equal(result.max, 5);
  assert.equal(input[0].date, '2026-01-03');
});
test('a lone observation inside the window cannot claim a range', () => {
  assert.equal(getIndicatorReading('DGS10', [point('2020-01-01', 2), point('2026-11-12', 4)]).range, null);
});
test('leap day follows the existing calendar-year convention', () => {
  const result = getIndicatorReading('DGS10', [point('2023-02-28', 1), point('2023-03-01', 2), point('2024-02-29', 3)]).range;
  assert.equal(result.start, '2023-03-01');
  assert.equal(result.min, 2);
});
