'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, ChartNoAxesCombined, RefreshCw, Star, X } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { TodayHighlights } from '@/components/Dashboard/TodayHighlights';
import { TradingViewWidget } from '@/components/Dashboard/TradingViewWidget';
import { ChartModal } from '@/components/Dashboard/ChartModal';
import type { FredSeriesData } from '@/lib/fred';
import { isValidHistory } from '@/lib/chartHistory';
import { useFavoriteIndicators } from '@/hooks/useFavoriteIndicators';
import { MARKET_ITEMS, MARKET_IDS } from '@/lib/marketCatalog';
import { MARKET_WATCHLIST } from '@/lib/marketWatchlist';

export default function MarketsPage() {
  // Read existing favorites without rewriting or transferring them to another product.
  const { favorites } = useFavoriteIndicators(MARKET_IDS);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selected, setSelected] = useState(MARKET_WATCHLIST[0].id);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Record<string, FredSeriesData> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const item = MARKET_WATCHLIST.find(market => market.id === selected)!;
  const favoriteMarkets = MARKET_WATCHLIST.filter(market => favorites.has(market.id));
  const visibleMarkets = onlyFavorites ? favoriteMarkets : MARKET_WATCHLIST;
  const index = visibleMarkets.findIndex(market => market.id === selected);
  const historyItem = MARKET_ITEMS.find(market => market.id === item.historyId);

  const select = (id: string) => { setHistoryOpen(false); setSelected(id); };
  const move = (direction: number) => {
    const next = visibleMarkets[index + direction];
    if (index >= 0 && next) select(next.id);
  };
  const startGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dy) < 40 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  };

  useEffect(() => {
    const active = scroller.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [selected, onlyFavorites]);

  // The saved-data endpoint is only needed when an existing history is opened.
  useEffect(() => {
    if (!historyOpen || snapshot || !item.historyId) return;
    const historyId = item.historyId;
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    fetch('/api/markets', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Unavailable');
        const result = await response.json();
        if (result.success !== true || !isValidHistory(result.data?.[historyId], historyId)) throw new Error('Invalid snapshot');
        if (active) { setSnapshot(result.data); setStatus('ready'); }
      }).catch(() => { if (active) setStatus('error'); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [historyOpen, item.historyId, retry, snapshot]);

  useEffect(() => {
    if (!historyOpen) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setHistoryOpen(false); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [historyOpen]);

  return <div className="market-page flex h-dvh flex-col overflow-hidden bg-canvas">
    <Header />
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden" id="market-content">
      <div className="mx-auto flex w-full max-w-[1400px] shrink-0 items-center justify-between gap-3 px-3 py-1.5 sm:px-6">
        <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl"><ChartNoAxesCombined className="h-5 w-5 text-accent" />マーケット</h2>
        <div className="flex items-center gap-2">
          <button type="button" aria-pressed={onlyFavorites} onClick={() => { const next = !onlyFavorites; setOnlyFavorites(next); if (next && favoriteMarkets.length && !favorites.has(selected)) select(favoriteMarkets[0].id); }} className={`inline-flex min-h-8 items-center gap-1 rounded-lg border px-2 text-xs ${onlyFavorites ? 'border-blue-600 bg-blue-600 text-white' : 'border-divider bg-surface text-muted'}`}><Star className="h-3.5 w-3.5" />お気に入り {favoriteMarkets.length}</button>
          <span className="hidden text-xs text-muted sm:block">15銘柄</span>
        </div>
      </div>
      <div className="shrink-0 [&>section]:mb-0"><TodayHighlights /></div>
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-3 py-2 sm:px-6">
        <div ref={scroller} aria-label="マーケット銘柄選択" className="flex shrink-0 snap-x gap-2 overflow-x-auto pb-1">
          {visibleMarkets.map(market => <button key={market.id} type="button" aria-pressed={item.id === market.id} onClick={() => select(market.id)}
            className={`min-h-10 shrink-0 snap-start rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${item.id === market.id ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-divider bg-surface text-body hover:border-emphasis'}`}>
            {market.title}
          </button>)}
        </div>
        {onlyFavorites && !visibleMarkets.length && <p className="py-1 text-xs text-muted">表示対象のお気に入りはありません。既存の登録情報は保持されています。</p>}
        <section aria-label={`${item.title}の詳細`} className="mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-divider bg-surface p-2 shadow-sm">
          <div role="group" aria-label="銘柄名を左右にスワイプして切替" tabIndex={0} data-market-swipe
            onPointerDown={startGesture} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null; }}
            onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}
            className="flex min-h-11 shrink-0 touch-pan-y select-none items-center justify-between gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-500">
            <button type="button" aria-label="前の銘柄" disabled={index <= 0} onClick={() => move(-1)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-divider text-accent disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1 text-center"><h3 className="truncate text-base font-bold">{item.title}</h3><p className="text-xs text-muted">ここを左右にスワイプで切替</p></div>
            <button type="button" aria-label="次の銘柄" disabled={index < 0 || index >= visibleMarkets.length - 1} onClick={() => move(1)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-divider text-accent disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <TradingViewWidget fill key={item.symbol} item={{ id: item.symbol, title: item.title, subtitle: item.status }} />
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-x-3">
            <details className="min-w-0 flex-1 text-xs leading-relaxed text-muted" data-market-freshness>
              <summary className="cursor-pointer py-1">{item.status} · 詳細</summary>
              <p>{item.symbol}。{item.description} データ時点・市場状態は公式表示に準拠。騰落は選択期間の変化（初期1Y）で、前日比とは異なります。</p>
            </details>
            {item.historyId && <button type="button" onClick={() => { setStatus(snapshot ? 'ready' : 'loading'); setHistoryOpen(true); }} className="min-h-8 shrink-0 text-xs text-accent">保存履歴</button>}
          </div>
        </section>
      </div>
    </main>
    <div aria-hidden="true" className="schedule-space shrink-0 border-t border-divider bg-canvas" />
    {historyOpen && item.historyId && (snapshot?.[item.historyId] ? <ChartModal isOpen seriesId={item.historyId} title={`${item.title} · 保存履歴`} unit={historyItem?.unit} source={historyItem?.source} data={snapshot[item.historyId].observations} color="#3b82f6" onClose={() => setHistoryOpen(false)} /> :
      <div role="dialog" aria-modal="true" aria-label="保存履歴" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
        <div className="relative w-full max-w-md rounded-2xl border border-divider bg-surface p-6 text-body">
          <button type="button" aria-label="保存履歴を閉じる" onClick={() => setHistoryOpen(false)} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center"><X className="h-5 w-5" /></button>
          <p role="status" className="pr-6">{status === 'error' ? '保存履歴を読み込めませんでした。' : '保存履歴を読み込み中…'}</p>
          {status === 'error' && <button type="button" onClick={() => { setStatus('loading'); setRetry(value => value + 1); }} className="mt-4 flex min-h-10 items-center gap-2 rounded-lg border border-divider px-3 text-accent"><RefreshCw className="h-4 w-4" />再試行</button>}
        </div>
      </div>)}
  </div>;
}
