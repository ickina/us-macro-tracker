'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play } from 'lucide-react';
import { generateUpcomingEvents } from '@/lib/schedule';
import { getJapanDate, selectScheduleHighlights } from '@/lib/highlights';

function subscribeClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onChange);
  };
}

export function TodayHighlights() {
  const minute = useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / 60_000), () => null);
  const highlights = useMemo(() => {
    if (minute === null) return null;
    const now = new Date(minute * 60_000);
    const [year, month, day] = getJapanDate(now).split('-').map(Number);
    // Generate the existing calendar for the Japanese month, regardless of device timezone.
    const events = generateUpcomingEvents(new Date(year, month - 1, day, 12));
    return selectScheduleHighlights(events, now);
  }, [minute]);

  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const event = highlights?.events[0];
  const heading = event ? (highlights?.isToday ? '今日の注目' : '次の注目') : '注目の予定';
  const text = highlights?.events.length
    ? highlights.events.map(item => `${item.date.slice(5).replace('-', '/')} ${item.timeJST}（日本時間） ${item.title}`).join('　｜　') +
      (highlights.remaining ? `　｜　ほか${highlights.remaining}件の予定` : '')
    : highlights ? '今後の注目予定は登録されていません' : '日本時間の予定を確認中…';

  useEffect(() => {
    const viewport = viewportRef.current;
    const label = textRef.current;
    const region = regionRef.current;
    if (!viewport || !label || !region) return;
    const measure = () => {
      // A constant 28px/sec stays readable on both phones and large screens.
      const width = Math.max(viewport.clientWidth, label.scrollWidth + 64);
      region.style.setProperty('--ticker-segment-width', `${width}px`);
      region.style.setProperty('--ticker-duration', `${Math.max(20, width / 28)}s`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(label);
    measure();
    return () => observer.disconnect();
  }, [text]);

  return (
    <section ref={regionRef} aria-label="今日の注目" data-paused={paused} data-static={!event}
      className="schedule-ticker mb-3 w-full">
      <div className="mx-auto flex h-10 w-full max-w-[1600px] items-center">
        <button type="button" onClick={() => window.dispatchEvent(new Event('ichi-open-schedule'))}
          aria-label={`${heading}。${text}。予定一覧を開く`}
          title="予定一覧を開く（日程は変更される場合があります）"
          className="ticker-open flex h-10 min-w-0 flex-1 items-center text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500">
          <span className="ticker-heading flex h-full shrink-0 items-center px-3 text-[11px] font-semibold sm:px-5 sm:text-xs">{heading}</span>
          <span ref={viewportRef} className="ticker-window block min-w-0 flex-1 overflow-hidden">
            <span className="ticker-track flex w-max items-center" aria-hidden="true">
              <span className="ticker-copy inline-flex shrink-0 items-center pl-4 text-xs sm:text-sm">
                <span ref={textRef} className="inline-block whitespace-nowrap">{text}</span>
              </span>
              <span className="ticker-copy ticker-duplicate inline-flex shrink-0 items-center pl-4 text-xs sm:text-sm">
                <span className="inline-block whitespace-nowrap">{text}</span>
              </span>
            </span>
          </span>
        </button>
        <button type="button" onClick={() => setPaused(value => !value)} disabled={!event}
          aria-label={paused ? '予定のスクロールを再開' : '予定のスクロールを一時停止'} aria-pressed={paused}
          className="ticker-pause flex h-10 w-11 shrink-0 items-center justify-center disabled:opacity-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500">
          {paused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
    </section>
  );
}
