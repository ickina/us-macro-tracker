'use client';

import { useEffect, useState } from 'react';

const MINIMUM_VISIBLE_MS = 460;
const EXIT_DURATION_MS = 320;

export function AppBootSplash() {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const mountedAt = performance.now();
    let exitTimer = 0;
    let hideTimer = 0;
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const remaining = Math.max(90, MINIMUM_VISIBLE_MS - mountedAt);
        exitTimer = window.setTimeout(() => {
          setIsLeaving(true);
          hideTimer = window.setTimeout(() => setIsHidden(true), EXIT_DURATION_MS);
        }, remaining);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (isHidden) return null;

  return (
    <div
      id="app-boot-splash"
      className={isLeaving ? 'app-boot-splash app-boot-splash-leaving' : 'app-boot-splash'}
      role="status"
      aria-label="ichi Macroを準備しています"
    >
      <div className="app-boot-mark" aria-hidden="true">
        <span className="app-boot-halo" />
        <svg viewBox="0 0 64 64" className="app-boot-icon">
          <path className="app-boot-wave" d="M10 33h10l4-15 8 30 7-24 5 9h10" />
        </svg>
      </div>
      <p className="app-boot-title">ichi Macro</p>
      <p className="app-boot-copy">
        今日の情報を準備しています
        <span className="app-boot-dots" aria-hidden="true"><i /><i /><i /></span>
      </p>
    </div>
  );
}
