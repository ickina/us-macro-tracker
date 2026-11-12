import type { Observation } from './fred';

type Guide = { up: string; down: string; flat: string; definition: string; reading: string; digits: number; unit: string };
const guides = new Map<string, Guide>([
  ['DEXUSEU', { up: 'ユーロ高・ドル安方向', down: 'ユーロ安・ドル高方向', flat: '前回と同じ交換レート', definition: '1ユーロを何ドルに交換できるかを表します。', reading: '上がると1ユーロで受け取れるドルが増え、下がると減ります。ドル円とは、数字が上がったときのドルの方向が異なります。', digits: 4, unit: 'ドル／ユーロ' }],
  ['DTWEXBGS', { up: '幅広い通貨に対してドル高', down: '幅広い通貨に対してドル安', flat: 'ドルの強さは前回と同じ', definition: '貿易で関わりの深い通貨をまとめて見た、ドルの強さの目安です。', reading: '上昇はドル高、低下はドル安方向です。この名目総合指数は、一般的なDXYとは別の指数です。', digits: 2, unit: '指数' }],
  ['DGS10', { up: '米国の長期金利が上昇', down: '米国の長期金利が低下', flat: '長期金利は前回と同じ', definition: '米10年国債の利回りで、長期金利の目安として見ます。', reading: '一般に、金利が上がると既存の債券価格は下がる方向に動きます。金利の数字と債券の価格は別のものです。', digits: 2, unit: '％' }],
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
  const label = position === null ? '期間中は同じ水準' : position === 0 ? '期間内の最低値' : position === 1 ? '期間内の最高値' : position <= 1 / 3 ? '低めの位置' : position >= 2 / 3 ? '高めの位置' : '中ほど';
  return { ...guide, direction, range: { min, max, latest: latest.value, position, label, fullYear, start: fullYear ? cutoff : window[0].date, end: latest.date, count: window.length } };
}
export type IndicatorReading = NonNullable<ReturnType<typeof getIndicatorReading>>;
