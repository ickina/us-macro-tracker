import type { FredSeriesData } from './fred';

type IndicatorItem = { id: string; category: string };
type ValidObservation = { date: string; value: number };
export type TodayIndicatorSelection = {
  id: string;
  category: string;
  latestDate: string;
  relativeMove: number;
  direction: -1 | 0 | 1;
  score: number;
};

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function validObservations(series?: FredSeriesData): ValidObservation[] {
  if (!series) return [];
  return series.observations
    .filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(Number(item.value)))
    .map(item => ({ date: item.date, value: Number(item.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function daysBetween(earlier: string, later: string) {
  return Math.max(0, (Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / 86_400_000);
}

/**
 * Selects notable latest moves without comparing incompatible raw units.
 * Each series is measured against its own recent, non-zero changes and only
 * remains eligible while its latest value is current for that series' cadence.
 */
export function selectTodayIndicators(
  items: readonly IndicatorItem[],
  data: Record<string, FredSeriesData>,
  limit = 3,
): TodayIndicatorSelection[] {
  if (limit <= 0) return [];
  const prepared = items.map(item => ({ item, observations: validObservations(data[item.id]) }))
    .filter(entry => entry.observations.length >= 3);
  const referenceDate = prepared.map(entry => entry.observations.at(-1)!.date).sort().at(-1);
  if (!referenceDate) return [];

  const ranked = prepared.map(({ item, observations }) => {
    const latest = observations.at(-1)!;
    const previous = observations.at(-2)!;
    const recentBeforeLatest = observations.slice(-14, -1);
    const historicalChanges: number[] = [];
    for (let index = 1; index < recentBeforeLatest.length; index++) {
      const change = Math.abs(recentBeforeLatest[index].value - recentBeforeLatest[index - 1].value);
      if (change > 0) historicalChanges.push(change);
    }

    const recentGaps: number[] = [];
    for (let index = Math.max(1, observations.length - 8); index < observations.length; index++) {
      const gap = daysBetween(observations[index - 1].date, observations[index].date);
      if (gap > 0) recentGaps.push(gap);
    }

    const latestChange = Math.abs(latest.value - previous.value);
    const typicalChange = median(historicalChanges) || Math.max(Math.abs(previous.value) * 0.001, 1e-9);
    const expectedGap = median(recentGaps) || 30;
    const age = daysBetween(latest.date, referenceDate);
    const freshnessLimit = Math.min(400, Math.max(7, expectedGap * 2.5));
    const freshness = Math.max(0.5, 1 - (age / freshnessLimit) * 0.5);

    return {
      id: item.id,
      category: item.category,
      latestDate: latest.date,
      relativeMove: latestChange / typicalChange,
      direction: Math.sign(latest.value - previous.value) as -1 | 0 | 1,
      score: age <= freshnessLimit ? (latestChange / typicalChange) * freshness : -1,
    };
  }).filter(entry => entry.score >= 0)
    .sort((a, b) => b.score - a.score || b.latestDate.localeCompare(a.latestDate) || a.id.localeCompare(b.id));

  // Keep the first view broad: choose the strongest move from different areas
  // before filling any remaining slot from the overall ranking.
  const selected: TodayIndicatorSelection[] = [];
  const categories = new Set<string>();
  for (const entry of ranked) {
    if (categories.has(entry.category)) continue;
    selected.push(entry);
    categories.add(entry.category);
    if (selected.length === limit) return selected;
  }
  for (const entry of ranked) {
    if (selected.some(candidate => candidate.id === entry.id)) continue;
    selected.push(entry);
    if (selected.length === limit) break;
  }
  return selected;
}

export function selectTodayIndicatorIds(
  items: readonly IndicatorItem[],
  data: Record<string, FredSeriesData>,
  limit = 3,
) {
  return selectTodayIndicators(items, data, limit).map(item => item.id);
}
