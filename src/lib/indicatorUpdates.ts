import type { FredSeriesData } from './fred';

export type IndicatorSnapshot = Record<string, { date: string; value: number }>;

export function createIndicatorSnapshot(data: Record<string, FredSeriesData>): IndicatorSnapshot {
  const snapshot: IndicatorSnapshot = {};
  for (const [id, series] of Object.entries(data)) {
    const latest = series.observations.at(-1);
    if (latest && /^\d{4}-\d{2}-\d{2}$/.test(latest.date) && latest.value.trim() !== '' && Number.isFinite(Number(latest.value))) {
      snapshot[id] = { date: latest.date, value: Number(latest.value) };
    }
  }
  return snapshot;
}

export function parseIndicatorSnapshot(raw: string | null): IndicatorSnapshot | null {
  try {
    const saved = JSON.parse(raw ?? 'null');
    if (saved?.version !== 1 || !saved.indicators || typeof saved.indicators !== 'object' || Array.isArray(saved.indicators)) return null;
    const entries = Object.entries(saved.indicators).filter((entry): entry is [string, { date: string; value: number }] => {
      const item = entry[1];
      return typeof item === 'object' && item !== null && 'date' in item && 'value' in item &&
        typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
        typeof item.value === 'number' && Number.isFinite(item.value);
    });
    return entries.length ? Object.fromEntries(entries) : null;
  } catch { return null; }
}

export function findUpdatedIndicators(current: IndicatorSnapshot, previous: IndicatorSnapshot | null) {
  if (previous === null) return new Set<string>();
  return new Set(Object.entries(current).filter(([id, latest]) => {
    const old = previous[id];
    // Don't describe an older response as an update; compare numbers, not formatting.
    return !old || latest.date > old.date || (latest.date === old.date && latest.value !== old.value);
  }).map(([id]) => id));
}
