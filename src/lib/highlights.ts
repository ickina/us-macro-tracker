import type { EconomicEvent } from './schedule';

const japanDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function getJapanDate(now: Date) {
  const parts = japanDate.formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function selectScheduleHighlights(events: EconomicEvent[], now: Date) {
  const today = getJapanDate(now);
  const upcoming = events
    .filter(event => event.impact !== 'Medium' && event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) ||
      (a.impact === b.impact ? 0 : a.impact === 'Critical' ? -1 : 1) ||
      a.timeJST.localeCompare(b.timeJST));
  const date = upcoming[0]?.date;
  const sameDay = upcoming.filter(event => event.date === date);
  return {
    today,
    date,
    isToday: date === today,
    events: sameDay.slice(0, 2),
    remaining: Math.max(0, sameDay.length - 2),
  };
}
