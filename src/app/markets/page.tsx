'use client';

import { useEffect, useState } from 'react';
import { ChartNoAxesCombined, List, RefreshCw, X } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { PageHeading } from '@/components/Layout/PageHeading';
import { TodayHighlights } from '@/components/Dashboard/TodayHighlights';
import { TradingViewWidget } from '@/components/Dashboard/TradingViewWidget';
import { ChartModal } from '@/components/Dashboard/ChartModal';
import type { FredSeriesData } from '@/lib/fred';
import { isValidHistory } from '@/lib/chartHistory';
import { useFavoriteIndicators } from '@/hooks/useFavoriteIndicators';
import { MARKET_ITEMS, MARKET_IDS } from '@/lib/marketCatalog';
import { MARKET_WATCHLIST } from '@/lib/marketWatchlist';
import { MarketStepNavigator } from '@/components/Market/MarketStepNavigator';
import { MarketPicker } from '@/components/Market/MarketPicker';

export default function MarketsPage() {
  // Read existing favorites without rewriting or transferring them to another product.
  const { favorites } = useFavoriteIndicators(MARKET_IDS);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState(MARKET_WATCHLIST[0].id);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Record<string, FredSeriesData> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const item = MARKET_WATCHLIST.find(market => market.id === selected)!;
  const favoriteMarkets = MARKET_WATCHLIST.filter(market => favorites.has(market.id));
  const visibleMarkets = onlyFavorites ? favoriteMarkets : MARKET_WATCHLIST;
  const historyItem = MARKET_ITEMS.find(market => market.id === item.historyId);

  const select = (id: string) => { setHistoryOpen(false); setSelected(id); };
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
      <PageHeading title="マーケット" icon={ChartNoAxesCombined}>
        <button type="button" aria-haspopup="dialog" aria-expanded={pickerOpen} onClick={() => setPickerOpen(true)} className="flex min-h-9 items-center gap-1.5 rounded-lg border border-divider bg-surface px-2.5 text-sm font-semibold text-accent"><List className="h-4 w-4" />銘柄一覧<span className="rounded-full bg-blue-500/10 px-1.5 text-xs">{onlyFavorites ? `${visibleMarkets.length}/15` : '15'}</span></button>
      </PageHeading>
      <div className="shrink-0 [&>section]:mb-0"><TodayHighlights /></div>
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-3 py-2 sm:px-6">
        <section aria-label={`${item.title}の詳細`} className="mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-divider bg-surface p-2 shadow-sm">
          <MarketStepNavigator item={item} items={visibleMarkets} onSelect={select} />
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
    {pickerOpen && <MarketPicker items={visibleMarkets} selected={selected} onlyFavorites={onlyFavorites} favoriteCount={favoriteMarkets.length} onClose={() => setPickerOpen(false)} onSelect={id => { select(id); setPickerOpen(false); }} onToggleFavorites={() => { const next = !onlyFavorites; setOnlyFavorites(next); if (next && favoriteMarkets.length && !favorites.has(selected)) select(favoriteMarkets[0].id); }} />}
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
