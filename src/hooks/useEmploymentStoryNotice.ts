'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FredSeriesData } from '@/lib/fred';
import { createEmploymentStoryVersion } from '@/lib/employmentStory';

const ACTIVE_NOTICE_KEY = 'ichi-employment-story-active-notice-v1';
const INTRO_PLAYED_KEY = 'ichi-employment-story-intro-played-v1';
const UPDATE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

type ActiveNotice = {
  version: string;
  firstShownAt: number;
};

function readStorage(key: string) {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* The notice is optional; the dashboard still works. */ }
}

function readActiveNotice(): ActiveNotice | null {
  const raw = readStorage(ACTIVE_NOTICE_KEY);
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<ActiveNotice>;
    if (typeof value.version !== 'string' || typeof value.firstShownAt !== 'number' || !Number.isFinite(value.firstShownAt)) return null;
    return { version: value.version, firstShownAt: value.firstShownAt };
  } catch {
    return null;
  }
}

export function useEmploymentStoryNotice(data: Record<string, FredSeriesData>) {
  const version = useMemo(() => createEmploymentStoryVersion(data), [data]);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [playIntro, setPlayIntro] = useState(false);

  useEffect(() => {
    let expiryTimer: number | undefined;
    let introTimer: number | undefined;

    const syncTimer = window.setTimeout(() => {
      if (version === null) {
        setHasUpdate(false);
        setPlayIntro(false);
        return;
      }

      const now = Date.now();
      const stored = readActiveNotice();
      const activeNotice = stored?.version === version
        ? stored
        : { version, firstShownAt: now };

      if (stored?.version !== version) {
        writeStorage(ACTIVE_NOTICE_KEY, JSON.stringify(activeNotice));
      }

      const expiresAt = activeNotice.firstShownAt + UPDATE_WINDOW_MS;
      const remaining = Math.max(0, expiresAt - now);
      setHasUpdate(remaining > 0);
      if (remaining > 0) {
        expiryTimer = window.setTimeout(() => setHasUpdate(false), remaining);
      }

      if (readStorage(INTRO_PLAYED_KEY) !== version) {
        writeStorage(INTRO_PLAYED_KEY, version);
        setPlayIntro(true);
        introTimer = window.setTimeout(() => setPlayIntro(false), 900);
      } else {
        setPlayIntro(false);
      }
    }, 0);

    return () => {
      if (syncTimer !== undefined) window.clearTimeout(syncTimer);
      if (expiryTimer !== undefined) window.clearTimeout(expiryTimer);
      if (introTimer !== undefined) window.clearTimeout(introTimer);
    };
  }, [version]);

  return { hasUpdate, playIntro };
}
