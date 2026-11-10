import type { Observation } from './fred';

export function isValidHistory(value: unknown, seriesId: string): value is { seriesId: string; observations: Observation[] } {
  if (!value || typeof value !== 'object' || !('seriesId' in value) || value.seriesId !== seriesId || !('observations' in value) || !Array.isArray(value.observations) || value.observations.length === 0) return false;
  let lastDate = '';
  return value.observations.every(item => {
    if (!item || typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || item.date <= lastDate || !Number.isFinite(Date.parse(item.date)) || new Date(item.date).toISOString().slice(0, 10) !== item.date || typeof item.value !== 'string' || item.value.trim() === '' || !Number.isFinite(Number(item.value))) return false;
    lastDate = item.date;
    return true;
  });
}

export function mergeChartHistory(history: Observation[], latest: Observation[]) {
  return [...new Map([...history, ...latest].map(item => [item.date, item])).values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function timeframeStart(latest: string, years: number) {
  const date = new Date(`${latest}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

// Retain endpoints and each bucket's extrema; keep rendering cost bounded for ALL.
export function sampleChartHistory(data: Observation[], maxPoints = 800): Observation[] {
  if (data.length <= maxPoints) return data;
  const result = [data[0]];
  const buckets = Math.floor((maxPoints - 2) / 2);
  for (let i = 0; i < buckets; i++) {
    const start = 1 + Math.floor(i * (data.length - 2) / buckets);
    const end = 1 + Math.floor((i + 1) * (data.length - 2) / buckets);
    let min = start, max = start;
    for (let j = start + 1; j < end; j++) {
      if (Number(data[j].value) < Number(data[min].value)) min = j;
      if (Number(data[j].value) > Number(data[max].value)) max = j;
    }
    for (const index of [...new Set([min, max])].sort((a, b) => a - b)) result.push(data[index]);
  }
  result.push(data[data.length - 1]);
  return result;
}
