"use client";

import Link from 'next/link';
import { BarChart3, CalendarDays, Eye, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ichi-first-visit-guide-v1';

interface FirstVisitGuideProps {
  onOpenAttention: () => void;
}

export function FirstVisitGuide({ onOpenAttention }: FirstVisitGuideProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setVisible(window.localStorage.getItem(STORAGE_KEY) !== 'dismissed');
      } catch {
        setVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      // 保存できない環境でも、現在の表示は閉じられるようにする。
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <section
      aria-labelledby="first-visit-guide-title"
      className="mx-2 mb-3 rounded-2xl border border-accent/25 bg-accent/5 px-3 py-2.5 shadow-sm md:mb-4 md:flex md:items-center md:gap-4 md:px-4"
    >
      <div className="mb-2 flex min-w-0 items-start justify-between gap-3 md:mb-0 md:w-[260px] md:flex-none">
        <div className="min-w-0">
          <h2 id="first-visit-guide-title" className="text-sm font-bold text-ink">
            まずはここから
          </h2>
          <p className="mt-0.5 text-xs leading-4 text-body">
            迷ったら、気になるところからどうぞ。
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
          aria-label="最初の案内を閉じる"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onOpenAttention}
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-accent/30 bg-accent/10 px-1.5 text-body shadow-sm transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex items-center gap-1 text-[11px] font-bold leading-4 sm:text-xs">
            <Eye className="h-3.5 w-3.5 flex-none text-accent" aria-hidden="true" />
            今の流れを見る
          </span>
          <span className="text-[9px] leading-3 text-muted sm:text-[10px]">直近の注目</span>
        </button>
        <Link
          href="/markets"
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-divider bg-surface px-1.5 text-body shadow-sm transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex items-center gap-1 text-[11px] font-bold leading-4 sm:text-xs">
            <BarChart3 className="h-3.5 w-3.5 flex-none text-accent" aria-hidden="true" />
            相場を見る
          </span>
          <span className="text-[9px] leading-3 text-muted sm:text-[10px]">マーケット</span>
        </Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('ichi-open-schedule'))}
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-divider bg-surface px-1.5 text-body shadow-sm transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex items-center gap-1 text-[11px] font-bold leading-4 sm:text-xs">
            <CalendarDays className="h-3.5 w-3.5 flex-none text-accent" aria-hidden="true" />
            次の発表を見る
          </span>
          <span className="text-[9px] leading-3 text-muted sm:text-[10px]">スケジュール</span>
        </button>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="hidden h-9 flex-none items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:flex"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        閉じる
      </button>
    </section>
  );
}
