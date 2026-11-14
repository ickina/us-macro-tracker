import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadModule() {
  const source = await readFile(new URL('../src/lib/todayIndicators.ts', import.meta.url), 'utf8');
  const javascript = ts.transpile(source, { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 });
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
}

const observations = (values, start = 1) => values.map((value, index) => ({
  date: `2026-11-${String(start + index).padStart(2, '0')}`,
  value: String(value),
}));

test('selects unusual moves relative to each series instead of comparing raw units', async () => {
  const { selectTodayIndicatorIds } = await loadModule();
  const items = [
    { id: 'large-unit', category: 'a' },
    { id: 'small-unit', category: 'b' },
    { id: 'steady', category: 'c' },
  ];
  const data = {
    'large-unit': { seriesId: 'large-unit', observations: observations([1000, 1100, 1200, 1300, 1400]) },
    'small-unit': { seriesId: 'small-unit', observations: observations([1, 1.01, 1.02, 1.03, 1.2]) },
    steady: { seriesId: 'steady', observations: observations([10, 11, 12, 13, 14]) },
  };
  assert.equal(selectTodayIndicatorIds(items, data, 1)[0], 'small-unit');
});

test('uses different categories before taking a second item from the same area', async () => {
  const { selectTodayIndicatorIds } = await loadModule();
  const items = [
    { id: 'fx-strongest', category: 'rates' },
    { id: 'fx-second', category: 'rates' },
    { id: 'stocks', category: 'markets' },
    { id: 'jobs', category: 'employment' },
  ];
  const data = Object.fromEntries(items.map((item, index) => [item.id, {
    seriesId: item.id,
    observations: observations([10, 11, 12, 13, 14 + (4 - index)]),
  }]));
  const selected = selectTodayIndicatorIds(items, data, 3);
  assert.equal(selected[0], 'fx-strongest');
  assert.equal(new Set(selected.map(id => items.find(item => item.id === id).category)).size, 3);
});

test('does not promote a series whose latest value is stale for its own cadence', async () => {
  const { selectTodayIndicatorIds } = await loadModule();
  const items = [{ id: 'fresh', category: 'a' }, { id: 'stale', category: 'b' }];
  const data = {
    fresh: { seriesId: 'fresh', observations: observations([1, 2, 3, 4, 5], 9) },
    stale: { seriesId: 'stale', observations: observations([1, 2, 3, 4, 100], 1) },
  };
  assert.deepEqual(selectTodayIndicatorIds(items, data, 2), ['fresh']);
});
