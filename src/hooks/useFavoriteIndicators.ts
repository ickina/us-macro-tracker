'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ichi-favorite-indicators';
const CHANGE_EVENT = 'ichi-favorites-change';
// Keep the current page usable even when the browser refuses storage writes.
let sessionOverride: string | undefined;

function getSnapshot() {
  if (sessionOverride !== undefined) return sessionOverride;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function parseFavorites(raw: string | null, validIds: ReadonlySet<string>): string[] {
  try {
    const saved: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(saved)
      ? [...new Set(saved.filter((id): id is string => typeof id === 'string' && validIds.has(id)))]
      : [];
  } catch { return []; }
}

export function useFavoriteIndicators(validIds: ReadonlySet<string>) {
  // The server renders an empty list; browser preferences load after hydration.
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const favorites = useMemo(() => new Set(parseFavorites(raw, validIds)), [raw, validIds]);

  const toggleFavorite = useCallback((id: string) => {
    if (!validIds.has(id)) return;
    const next = new Set(parseFavorites(getSnapshot(), validIds));
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const serialized = JSON.stringify([...next]);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
      sessionOverride = undefined;
    } catch { sessionOverride = serialized; }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [validIds]);

  return { favorites, toggleFavorite, sessionOnly: sessionOverride !== undefined };
}
