import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadScheduleModule() {
  const source = await readFile(new URL('../src/lib/schedule.ts', import.meta.url), 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
}

const { generateUpcomingEvents } = await loadScheduleModule();
const events = generateUpcomingEvents(new Date(2026, 10, 18, 12));
const eventById = (id) => events.find(event => event.id === id);

test('adds the official November housing release as one combined event', () => {
  const housing = eventById('housing-2026-10');
  assert.ok(housing);
  assert.equal(housing.date, '2026-11-18');
  assert.equal(housing.timeJST, '22:30');
  assert.equal(housing.impact, 'High');
  assert.match(housing.title, /住宅着工件数・建設許可件数/);
});

test('shows FOMC minutes on the correct following day in Japan', () => {
  const minutes = eventById('fomc-minutes-2026-11-18');
  assert.ok(minutes);
  assert.equal(minutes.date, '2026-11-19');
  assert.equal(minutes.timeJST, '04:00');
  assert.equal(minutes.impact, 'Critical');
  assert.equal(minutes.period, '10月27–28日会合');
});

test('converts FOMC policy announcements and later minutes to Japanese dates', () => {
  const decision = eventById('fomc-2026-11');
  const minutes = eventById('fomc-minutes-2026-12-30');
  assert.ok(decision);
  assert.ok(minutes);
  assert.equal(decision.date, '2026-12-10');
  assert.equal(decision.timeJST, '04:00 (会見 04:30)');
  assert.equal(minutes.date, '2026-12-31');
  assert.equal(minutes.timeJST, '04:00');
});
