'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
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

  return (
    <section aria-labelledby="today-highlights-title" className="mx-2 mb-4 rounded-2xl border border-divider bg-surface px-4 py-3 sm:mb-6 sm:px-5">
      <div className="flex items-center justify-between gap-2">
        <h3 id="today-highlights-title" className="flex items-center gap-2 text-sm font-semibold text-ink sm:text-base">
          <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />今日の注目
        </h3>
        <button type="button" onClick={() => window.dispatchEvent(new Event('ichi-open-schedule'))}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1 text-xs font-medium text-accent hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:text-sm">
          予定をすべて見る<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
      {highlights === null ? (
        <p className="py-2 text-xs text-muted">日本時間の予定を確認中…</p>
      ) : highlights.events.length === 0 ? (
        <p className="py-2 text-sm text-muted">今後の注目予定は登録されていません。</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            {highlights.isToday ? '本日の主な発表予定' : '本日の重要な発表予定はありません。次の注目予定はこちら。'}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {highlights.events.map(event => (
              <div key={event.id} className="min-w-0 border-l-2 border-blue-500/40 pl-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="font-semibold text-accent">{event.date.replaceAll('-', '/')} {event.timeJST}（日本時間）</span>
                  <span className={`rounded px-1.5 py-0.5 font-medium ${event.impact === 'Critical' ? 'bg-red-500/10 text-negative' : 'bg-amber-500/10 text-warning'}`}>
                    {event.impact === 'Critical' ? '最重要' : '重要'}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm font-medium leading-relaxed text-body">{event.title}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            既存スケジュールに基づく予定です。日程は変更される場合があります。
            {highlights.remaining > 0 && ` 同日のほか${highlights.remaining}件は予定一覧へ。`}
          </p>
        </>
      )}
    </section>
  );
}
