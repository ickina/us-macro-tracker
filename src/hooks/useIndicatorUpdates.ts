'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FredSeriesData } from '@/lib/fred';
import { createIndicatorSnapshot, findUpdatedIndicators, parseIndicatorSnapshot } from '@/lib/indicatorUpdates';

const STORAGE_KEY = 'ichi-last-seen-indicators-v1';

function readPreviousVisit() {
  if (typeof window === 'undefined') return null;
  try { return parseIndicatorSnapshot(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

export function useIndicatorUpdates(data: Record<string, FredSeriesData>) {
  // Dashboard data is empty on the server and until the first fetch, so saved
  // preferences do not change the initial HTML. Freeze this baseline per visit.
  const [previous] = useState(readPreviousVisit);
  const snapshot = useMemo(() => createIndicatorSnapshot(data), [data]);
  const updated = useMemo(() => findUpdatedIndicators(snapshot, previous), [snapshot, previous]);

  useEffect(() => {
    if (Object.keys(snapshot).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, indicators: snapshot }));
    } catch { /* Optional hints must never block the dashboard. */ }
  }, [snapshot]);

  return updated;
}
