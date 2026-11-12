import type { Observation } from './fred';

type Guide = { up: string; down: string; flat: string; definition: string; reading: string; digits: number; unit: string };
const guides = new Map<string, Guide>([
  ['DEXUSEU', { up: 'ユーロが強く、ドルが弱く', down: 'ユーロが弱く、ドルが強く', flat: '前回と変わらず', definition: '1ユーロを何ドルに交換できるか、という数字です。', reading: '数字が上がるとユーロが強くなり、下がるとドルが強くなります。', digits: 4, unit: 'ドル／ユーロ' }],
  ['DTWEXBGS', { up: 'ドルが強くなりました', down: 'ドルが弱くなりました', flat: '前回と変わらず', definition: 'いろいろな国の通貨と比べた、ドルの強さです。', reading: '数字が上がるとドルが強く、下がると弱くなります。よく使われるDXYとは別の指数です。', digits: 2, unit: '指数' }],
  ['DGS10', { up: '米国の長期金利が上がりました', down: '米国の長期金利が下がりました', flat: '前回と変わらず', definition: '米国に10年間お金を貸すときの、年あたりの収益率です。', reading: '一般に、この金利が上がると、すでに売られている国債の価格は下がります。', digits: 2, unit: '％' }],
]);

export function getIndicatorReading(seriesId: string, observations: readonly Observation[]) {
  const guide = guides.get(seriesId);
  if (!guide) return null;
  // Work on a copy; never modify the saved series or the card's existing calculations.
  const valid = observations.filter(item => typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(Date.parse(`${item.date}T00:00:00Z`)) && new Date(`${item.date}T00:00:00Z`).toISOString().slice(0, 10) === item.date && typeof item.value === 'string' && item.value.trim() !== '' && Number.isFinite(Number(item.value)))
    .map(item => ({ date: item.date, value: Number(item.value) })).sort((a, b) => a.date.localeCompare(b.date));
  const latest = valid.at(-1);
  const previous = valid.at(-2);
  const direction = !latest || !previous ? '比較データがまだ足りません' : latest.value > previous.value ? guide.up : latest.value < previous.value ? guide.down : guide.flat;
  if (!latest || !previous) return { ...guide, direction, range: null };
  const start = new Date(`${latest.date}T00:00:00Z`);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  const cutoff = start.toISOString().slice(0, 10);
  const fullYear = valid[0].date <= cutoff;
  const window = valid.filter(item => item.date >= cutoff);
  if (window.length < 2) return { ...guide, direction, range: null };
  const min = Math.min(...window.map(item => item.value));
  const max = Math.max(...window.map(item => item.value));
  const position = max === min ? null : Math.max(0, Math.min(1, (latest.value - min) / (max - min)));
  const label = position === null ? 'ずっと同じ値' : position === 0 ? 'いちばん低い' : position === 1 ? 'いちばん高い' : position <= 1 / 3 ? '低め' : position >= 2 / 3 ? '高め' : '中ほど';
  return { ...guide, direction, range: { min, max, latest: latest.value, position, label, fullYear, start: fullYear ? cutoff : window[0].date, end: latest.date, count: window.length } };
}
export type IndicatorReading = NonNullable<ReturnType<typeof getIndicatorReading>>;
