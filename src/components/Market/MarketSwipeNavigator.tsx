'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import type { WatchMarket } from '@/lib/marketWatchlist';

type Props = {
  item: WatchMarket;
  items: readonly WatchMarket[];
  onSelect: (id: string) => void;
};

export function MarketSwipeNavigator({ item, items, onSelect }: Props) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [direction, setDirection] = useState(1);
  const gesture = useRef<{ id: number; x: number; y: number; time: number } | null>(null);
  const index = items.findIndex(market => market.id === item.id);
  const previous = index > 0 ? items[index - 1] : undefined;
  const next = index >= 0 ? items[index + 1] : undefined;

  const move = (step: number) => {
    const target = step < 0 ? previous : next;
    gesture.current = null;
    setDragging(false);
    setOffset(0);
    if (target) { setDirection(step); onSelect(target.id); }
  };
  const cancel = () => { gesture.current = null; setDragging(false); setOffset(0); };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const track = (event: PointerEvent<HTMLDivElement>) => {
    const point = gesture.current;
    if (!point || point.id !== event.pointerId) return;
    const dx = event.clientX - point.x;
    const dy = event.clientY - point.y;
    if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx)) { cancel(); return; }
    const blocked = dx > 0 ? !previous : !next;
    setOffset(Math.max(-88, Math.min(88, dx * (blocked ? 0.16 : 0.65))));
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    const point = gesture.current;
    if (!point || point.id !== event.pointerId) return;
    const dx = event.clientX - point.x;
    const dy = event.clientY - point.y;
    const speed = Math.abs(dx) / Math.max(1, performance.now() - point.time);
    if ((Math.abs(dx) >= 48 || (Math.abs(dx) >= 24 && speed > 0.45)) && Math.abs(dy) < 40 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
    else cancel();
  };

  return <div role="group" aria-label="銘柄を左右にスワイプして切替" tabIndex={0} data-market-swipe data-dragging={dragging}
    onPointerDown={start} onPointerMove={track} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}
    onKeyDown={event => { if (event.target === event.currentTarget && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}
    className="market-swipe-nav relative shrink-0 touch-pan-y select-none overflow-hidden rounded-xl bg-canvas/70 py-1 focus-visible:outline-2 focus-visible:outline-accent">
    <div className={`grid grid-cols-[minmax(0,1fr)_minmax(0,2.7fr)_minmax(0,1fr)] items-center ${dragging ? '' : 'transition-transform duration-200 ease-out motion-reduce:transition-none'}`}
      style={{ transform: `translateX(${offset}px)` }} data-market-swipe-track>
      <button type="button" aria-label="前の銘柄" disabled={!previous} onClick={() => move(-1)}
        className="flex h-11 min-w-0 items-center gap-0.5 pl-1 text-xs text-muted transition-colors hover:text-accent disabled:opacity-30 sm:text-sm">
        <ChevronLeft className="h-4 w-4 shrink-0" /><span className="truncate">{previous?.title ?? '先頭'}</span>
      </button>
      <div className="min-w-0 px-1 text-center">
        <div key={item.id} className="market-swipe-current rounded-xl border border-blue-500/20 bg-blue-500/10 px-2 py-2" style={{ '--market-entry': `${direction * 28}px` } as React.CSSProperties}>
          <h3 aria-live="polite" aria-atomic="true" title={item.title} className="truncate text-base font-bold text-accent sm:text-lg">{item.title}</h3>
        </div>
      </div>
      <button type="button" aria-label="次の銘柄" disabled={!next} onClick={() => move(1)}
        className="flex h-11 min-w-0 items-center justify-end gap-0.5 pr-1 text-xs text-muted transition-colors hover:text-accent disabled:opacity-30 sm:text-sm">
        <span className="truncate">{next?.title ?? '最後'}</span><ChevronRight className="h-4 w-4 shrink-0" />
      </button>
    </div>
    <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs leading-4 text-muted"><MoveHorizontal aria-hidden="true" className="h-3.5 w-3.5" />左右にスワイプ <span aria-hidden="true">·</span><span>{index >= 0 ? `${index + 1} / ${items.length}` : '表示対象なし'}</span></p>
  </div>;
}
