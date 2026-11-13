'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WatchMarket } from '@/lib/marketWatchlist';

type Props = {
  item: WatchMarket;
  items: readonly WatchMarket[];
  onSelect: (id: string) => void;
};

export function MarketStepNavigator({ item, items, onSelect }: Props) {
  const index = items.findIndex(market => market.id === item.id);
  const previous = index > 0 ? items[index - 1] : undefined;
  const next = index >= 0 ? items[index + 1] : undefined;
  const move = (target?: WatchMarket) => { if (target) onSelect(target.id); };

  return <div role="group" aria-label="前後の銘柄へ切替" tabIndex={0}
    onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(previous); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(next); }
    }}
    className="grid shrink-0 grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-2 rounded-xl bg-canvas/70 p-1 focus-visible:outline-2 focus-visible:outline-accent sm:grid-cols-[minmax(76px,120px)_minmax(0,1fr)_minmax(76px,120px)]">
    <button type="button" aria-label={previous ? `前の銘柄：${previous.title}` : '前の銘柄はありません'} title={previous?.title} disabled={!previous} onClick={() => move(previous)}
      className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-xl border border-divider bg-surface px-2 text-muted shadow-sm transition-colors hover:border-blue-500 hover:text-accent disabled:opacity-30">
      <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="hidden truncate text-xs font-medium sm:block">{previous?.title ?? '先頭'}</span>
    </button>
    <div className="min-w-0 text-center">
      <h3 aria-live="polite" aria-atomic="true" title={item.title} className="truncate text-base font-bold text-accent sm:text-lg">{item.title}</h3>
      <p className="mt-0.5 text-[11px] leading-4 text-muted"><span>{index >= 0 ? `${index + 1} / ${items.length}` : '表示対象なし'}</span><span aria-hidden="true"> · </span>左右ボタンで切替</p>
    </div>
    <button type="button" aria-label={next ? `次の銘柄：${next.title}` : '次の銘柄はありません'} title={next?.title} disabled={!next} onClick={() => move(next)}
      className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-xl border border-divider bg-surface px-2 text-muted shadow-sm transition-colors hover:border-blue-500 hover:text-accent disabled:opacity-30">
      <span className="hidden truncate text-xs font-medium sm:block">{next?.title ?? '最後'}</span><ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
    </button>
  </div>;
}
