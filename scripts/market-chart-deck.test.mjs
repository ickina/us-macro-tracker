import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadDeckModule() {
  const source = await readFile(new URL('../src/lib/marketChartDeck.ts', import.meta.url), 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
}

const { getStableMarketChartDeck } = await loadDeckModule();
const watchlist = ['a', 'b', 'c', 'd'].map(id => ({ id }));

test('keeps overlapping charts in watchlist order while moving right', () => {
  const first = getStableMarketChartDeck(watchlist, watchlist[0], [watchlist[1]]);
  const second = getStableMarketChartDeck(watchlist, watchlist[1], [watchlist[0], watchlist[2]]);
  assert.deepEqual(first.map(item => item.id), ['a', 'b']);
  assert.deepEqual(second.map(item => item.id), ['a', 'b', 'c']);
  assert.ok(second.indexOf(watchlist[0]) < second.indexOf(watchlist[1]));
});

test('keeps overlapping charts in watchlist order while moving left', () => {
  const last = getStableMarketChartDeck(watchlist, watchlist[3], [watchlist[2]]);
  const previous = getStableMarketChartDeck(watchlist, watchlist[2], [watchlist[1], watchlist[3]]);
  assert.deepEqual(last.map(item => item.id), ['c', 'd']);
  assert.deepEqual(previous.map(item => item.id), ['b', 'c', 'd']);
  assert.ok(previous.indexOf(watchlist[2]) < previous.indexOf(watchlist[3]));
});

test('retains the current chart when a favorites filter has no visible item', () => {
  assert.deepEqual(getStableMarketChartDeck([], watchlist[0], []), [watchlist[0]]);
});
