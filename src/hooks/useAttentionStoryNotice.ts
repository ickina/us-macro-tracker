'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FredSeriesData } from '@/lib/fred';
import { createEmploymentStoryVersion } from '@/lib/employmentStory';
import { createInflationStoryVersion } from '@/lib/inflationStory';

export type AttentionTheme = 'employment' | 'inflation';

const ACTIVE_NOTICE_KEYS: Record<AttentionTheme, string> = {
  employment: 'ichi-employment-story-active-notice-v1',
  inflation: 'ichi-inflation-story-active-notice-v1',
};
const INTRO_PLAYED_KEY = 'ichi-attention-story-intro-played-v2';
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

function readActiveNotice(key: string): ActiveNotice | null {
  const raw = readStorage(key);
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<ActiveNotice>;
    if (typeof value.version !== 'string' || typeof value.firstShownAt !== 'number' || !Number.isFinite(value.firstShownAt)) return null;
    return { version: value.version, firstShownAt: value.firstShownAt };
  } catch {
    return null;
  }
}

export function useAttentionStoryNotice(data: Record<string, FredSeriesData>) {
  const versions = useMemo(() => ({
    employment: createEmploymentStoryVersion(data),
    inflation: createInflationStoryVersion(data),
  }), [data]);
  const [themeHasUpdate, setThemeHasUpdate] = useState<Record<AttentionTheme, boolean>>({ employment: false, inflation: false });
  const [playIntro, setPlayIntro] = useState(false);
  const [preferredTheme, setPreferredTheme] = useState<AttentionTheme | null>(null);

  useEffect(() => {
    const timers: number[] = [];
    const syncTimer = window.setTimeout(() => {
      const now = Date.now();
      const next = { employment: false, inflation: false };
      const newlyChanged: AttentionTheme[] = [];

      (Object.keys(versions) as AttentionTheme[]).forEach(theme => {
        const version = versions[theme];
        if (version === null) return;
        const storageKey = ACTIVE_NOTICE_KEYS[theme];
        const stored = readActiveNotice(storageKey);
        const activeNotice = stored?.version === version ? stored : { version, firstShownAt: now };
        if (stored?.version !== version) {
          writeStorage(storageKey, JSON.stringify(activeNotice));
          newlyChanged.push(theme);
        }
        const remaining = Math.max(0, activeNotice.firstShownAt + UPDATE_WINDOW_MS - now);
        next[theme] = remaining > 0;
        if (remaining > 0) {
          timers.push(window.setTimeout(() => setThemeHasUpdate(current => ({ ...current, [theme]: false })), remaining));
        }
      });

      setThemeHasUpdate(next);
      setPreferredTheme(newlyChanged.length === 1 ? newlyChanged[0] : null);

      const introVersion = `${versions.employment ?? 'none'}|${versions.inflation ?? 'none'}`;
      if (newlyChanged.length > 0 && readStorage(INTRO_PLAYED_KEY) !== introVersion) {
        writeStorage(INTRO_PLAYED_KEY, introVersion);
        setPlayIntro(true);
        timers.push(window.setTimeout(() => setPlayIntro(false), 900));
      } else {
        setPlayIntro(false);
      }
    }, 0);
    timers.push(syncTimer);

    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [versions]);

  return {
    hasUpdate: themeHasUpdate.employment || themeHasUpdate.inflation,
    themeHasUpdate,
    playIntro,
    preferredTheme,
  };
}
