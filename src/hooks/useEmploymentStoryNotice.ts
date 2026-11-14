'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FredSeriesData } from '@/lib/fred';
import { createEmploymentStoryVersion } from '@/lib/employmentStory';

const SEEN_KEY = 'ichi-employment-story-seen-v1';
const NOTIFIED_KEY = 'ichi-employment-story-notified-v1';

function readStorage(key: string) {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* The notice is optional; the dashboard still works. */ }
}

export function useEmploymentStoryNotice(data: Record<string, FredSeriesData>) {
  const version = useMemo(() => createEmploymentStoryVersion(data), [data]);
  const [seenVersion, setSeenVersion] = useState(() => readStorage(SEEN_KEY));
  const [notifiedVersion] = useState(() => readStorage(NOTIFIED_KEY));
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const hasUpdate = version !== null && version !== seenVersion;
  const showToast = version !== null && version !== notifiedVersion && version !== dismissedVersion;

  useEffect(() => {
    if (!showToast || version === null) return;
    writeStorage(NOTIFIED_KEY, version);
    const timer = window.setTimeout(() => setDismissedVersion(version), 10_000);
    return () => window.clearTimeout(timer);
  }, [showToast, version]);

  const dismissToast = useCallback(() => {
    if (version !== null) setDismissedVersion(version);
  }, [version]);

  const markSeen = useCallback(() => {
    if (version === null) return;
    setSeenVersion(version);
    setDismissedVersion(version);
    writeStorage(SEEN_KEY, version);
  }, [version]);

  return { hasUpdate, showToast, dismissToast, markSeen };
}
