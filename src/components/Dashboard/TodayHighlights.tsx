'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { ArrowRight } from 'lucide-react';
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

  const event = highlights?.events[0];
  const extra = highlights ? Math.max(0, highlights.events.length - 1) + highlights.remaining : 0;
  const heading = event ? (highlights?.isToday ? '今日の注目' : '次の注目') : '注目の予定';
  const time = event?.timeJST.match(/^\d{2}:\d{2}/)?.[0] ?? event?.timeJST;
  const dateLabel = event ? `${event.date.slice(5).replace('-', '/')} ${time}（日本時間）` : '';
  const description = event
    ? `${event.date} ${event.timeJST} 日本時間、${event.title}${extra ? `、ほか${extra}件` : ''}。予定一覧を開く`
    : '注目の発表予定の一覧を開く';

  return (
    <section aria-label="今日の注目" className="mx-2 mb-3">
      <button type="button" onClick={() => window.dispatchEvent(new Event('ichi-open-schedule'))}
        aria-label={description}
        title={event ? `${description}。日程は変更される場合があります。` : description}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-divider bg-surface px-3 py-2 text-left transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
        <span className="block min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[11px] leading-4">
            <span className="shrink-0 font-semibold text-accent">{heading}</span>
            {event && <span className="truncate text-muted">{dateLabel}</span>}
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className="truncate text-sm font-medium leading-5 text-body">
              {event?.title ?? (highlights ? '今後の注目予定は登録されていません' : '日本時間の予定を確認中…')}
            </span>
            {extra > 0 && <span className="shrink-0 text-[11px] text-muted">ほか{extra}件</span>}
          </span>
        </span>
        <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
      </button>
    </section>
  );
}
