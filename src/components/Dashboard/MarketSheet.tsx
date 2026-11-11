"use client";

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Star, X } from 'lucide-react';
import { TRADING_VIEW_MARKETS, type TradingViewMarket } from '@/lib/tradingViewMarkets';
import { TradingViewWidget } from './TradingViewWidget';
import { MARKET_IDS, MARKET_ITEMS } from '@/lib/marketCatalog';
import { useFavoriteIndicators } from '@/hooks/useFavoriteIndicators';
import { LineChartComponent } from '@/components/Charts/LineChart';
import type { Snapshot, Detail } from './MarketDrawer';

export default function MarketSheet({ snapshot, status, onRefresh, onClose, onDetail, onTradingViewDetail }: {
  snapshot: Snapshot | null; status: string; onRefresh: () => void; onClose: () => void; onDetail: (detail: Detail) => void; onTradingViewDetail: (item: TradingViewMarket) => void;
}) {
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { favorites } = useFavoriteIndicators(MARKET_IDS);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  const items = MARKET_ITEMS.filter(item => !onlyFavorites || favorites.has(item.id));

  return (
    <dialog ref={dialogRef} aria-labelledby="market-sheet-title" onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="market-sheet fixed inset-x-0 bottom-0 top-auto m-0 max-h-[75dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-divider bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px]">
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-divider" />
        <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div><h2 id="market-sheet-title" className="text-base font-bold sm:text-lg">マーケット</h2>
            <p className="mt-0.5 text-xs text-muted">既存銘柄は日次の保存データ。NVDA・金はTradingViewの試験表示です。</p></div>
          <button type="button" onClick={onClose} aria-label="マーケット一覧を閉じる" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised text-muted hover:text-ink"><X aria-hidden="true" className="h-5 w-5" /></button>
        </div>
        <div className="flex items-center gap-2 px-4 pb-3 sm:px-6">
          <button type="button" onClick={() => setOnlyFavorites(false)} aria-pressed={!onlyFavorites}
            className={`min-h-11 rounded-xl px-3 text-xs font-semibold ${!onlyFavorites ? 'bg-blue-600 text-white' : 'bg-raised text-muted'}`}>主要マーケット</button>
          <button type="button" onClick={() => setOnlyFavorites(true)} aria-pressed={onlyFavorites}
            className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-semibold ${onlyFavorites ? 'bg-blue-600 text-white' : 'bg-raised text-muted'}`}><Star aria-hidden="true" className="h-3.5 w-3.5" />お気に入り {favorites.size}</button>
          <button type="button" onClick={onRefresh} disabled={status === 'loading'} aria-label="マーケットの保存データを再取得"
            className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-divider text-accent disabled:opacity-40"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} /></button>
        </div>
        {status === 'error' && <p role="status" className="px-4 pb-3 text-sm text-negative sm:px-6">読み込めませんでした。{snapshot ? '前に読み込んだデータを表示しています。' : '更新ボタンから再試行できます。'}</p>}
        {!snapshot ? <p role="status" className="px-4 py-8 text-center text-sm text-muted">{status === 'error' ? 'データを取得できませんでした' : '価格を読み込み中…'}</p>
          : items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">マーケットのお気に入りはまだありません。ダッシュボードの☆から登録できます。</p>
          : <div aria-label="左右にスワイプできるマーケット一覧" className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-6 sm:px-6">
            {items.map(item => {
              const series = snapshot.data[item.id];
              if (!series) return null;
              const latest = series.observations.at(-1)!;
              const previous = series.observations.at(-2);
              const change = previous ? Number(latest.value) - Number(previous.value) : 0;
              return <button key={item.id} type="button" onClick={() => onDetail({ item, series })}
                aria-label={`${item.title}の詳細グラフを見る`}
                className="w-[min(78vw,280px)] shrink-0 snap-start rounded-2xl border border-divider bg-canvas p-4 text-left hover:border-emphasis focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500">
                <span className="block text-sm font-semibold text-body">{item.title}</span>
                <span className="mt-2 block break-all text-2xl font-bold tabular-nums">{Number(latest.value).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</span>
                <span className="mt-1 block text-xs text-muted">{item.unit}　{previous ? `前回比 ${change > 0 ? '+' : ''}${change.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}` : ''}</span>
                <span aria-hidden="true" className="mt-3 block h-20 w-full"><LineChartComponent data={series.observations.slice(-120)} color="#3b82f6" /></span>
                <span className="mt-2 block text-[11px] text-muted">基準日 {latest.date} ／ 日次</span>
                <span className="mt-1 block text-[11px] text-muted">取得元：{item.source}</span>
              </button>;
            })}
          </div>}
        {!onlyFavorites && <div aria-label="TradingView試験銘柄" className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:px-6">
          {TRADING_VIEW_MARKETS.map(item => <section key={item.id} className="w-[min(88vw,360px)] shrink-0 snap-start rounded-2xl border border-divider bg-surface p-4">
            <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{item.title}</h3><span className="rounded-full bg-raised px-2 py-1 text-[10px] text-muted">試験追加</span></div>
            <p className="mb-2 text-[11px] text-muted">{item.subtitle}</p>
            <TradingViewWidget item={item} compact />
            <button type="button" onClick={() => onTradingViewDetail(item)} aria-label={`${item.title}の詳細グラフを見る`} className="mt-2 min-h-11 w-full rounded-xl border border-divider bg-raised text-xs font-semibold text-accent hover:bg-raised-hover">詳細グラフを見る · 1Y</button>
          </section>)}
        </div>}
        {!onlyFavorites && <p className="px-4 pb-3 text-[11px] leading-relaxed text-muted sm:px-6">TradingView銘柄の価格・遅延は提供元の仕様によります。金（GOLD）は金・銀鉱山株指数とは別の銘柄です。</p>}
        <p className="px-4 pb-4 text-[11px] text-muted sm:px-6">左右にスワイプして比較できます。カードを押すと詳細グラフへ。</p>
      </div>
    </dialog>
  );
}
