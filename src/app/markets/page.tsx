'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChartNoAxesCombined, RefreshCw, Star } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { MarketTicker } from '@/components/Market/MarketTicker';
import { TradingViewWidget } from '@/components/Dashboard/TradingViewWidget';
import { ChartModal } from '@/components/Dashboard/ChartModal';
import type { FredSeriesData } from '@/lib/fred';
import { isValidHistory } from '@/lib/chartHistory';
import { useFavoriteIndicators } from '@/hooks/useFavoriteIndicators';
import { MARKET_ITEMS, MARKET_IDS } from '@/lib/marketCatalog';
import { PROTOTYPE_MARKETS } from '@/lib/marketPrototype';

export default function MarketsPage() {
  const { favorites } = useFavoriteIndicators(MARKET_IDS);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState('DEXJPUS');
  const [snapshot, setSnapshot] = useState<Record<string, FredSeriesData> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    fetch('/api/markets', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Unavailable');
        const result = await response.json();
        if (result.success !== true || !result.data) throw new Error('Invalid snapshot');
        for (const market of MARKET_ITEMS) if (!isValidHistory(result.data[market.id], market.id)) throw new Error('Incomplete snapshot');
        if (active) { setSnapshot(result.data); setStatus('ready'); }
      }).catch(() => { if (active) setStatus('error'); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [retry]);
  const scroller = useRef<HTMLDivElement>(null);
  const item = PROTOTYPE_MARKETS.find(item => item.id === selected)!;
  const visibleMarkets = PROTOTYPE_MARKETS.filter(market => !onlyFavorites || favorites.has(market.id));
  return <div className="flex h-dvh flex-col overflow-hidden bg-canvas market-page">
    <div className="shrink-0"><Header /></div>
    <main className="min-h-0 flex flex-1 flex-col overflow-hidden" id="market-content">
      <div className="mx-auto flex w-full max-w-[1400px] shrink-0 items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
        <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl"><ChartNoAxesCombined className="h-5 w-5 text-accent sm:h-7 sm:w-7" />マーケット</h2>
        <div className="flex items-center gap-2"><button type="button" aria-pressed={onlyFavorites} onClick={() => { const next = !onlyFavorites; setOnlyFavorites(next); const first = PROTOTYPE_MARKETS.find(market => favorites.has(market.id)); if (next && first && !favorites.has(selected)) setSelected(first.id); }} className={`inline-flex min-h-8 items-center gap-1 rounded-lg border px-2 text-[10px] ${onlyFavorites ? 'border-blue-600 bg-blue-600 text-white' : 'border-divider bg-surface text-muted'}`}><Star className="h-3 w-3" />お気に入り {favorites.size}</button><span className="hidden rounded-full border border-divider bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted sm:block">14銘柄</span></div>
      </div>
      <div className="shrink-0"><MarketTicker /></div>
      <div className="mx-auto flex w-full min-h-0 max-w-[1400px] flex-1 flex-col px-3 py-2 sm:px-6">
        <div className="mb-1 hidden shrink-0 items-center justify-between sm:flex"><h3 className="text-xs font-semibold text-muted">銘柄を選ぶ <span className="ml-1 font-normal">／ 横にスワイプ</span></h3>
          <div className="flex items-center gap-1">
          <div className="hidden gap-1 sm:flex">{[-1, 1].map(direction => <button key={direction} type="button" aria-label={direction < 0 ? '前の銘柄へスクロール' : '次の銘柄へスクロール'} onClick={() => scroller.current?.scrollBy({ left: direction * 400, behavior: 'smooth' })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-divider bg-surface text-muted">{direction < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>)}</div></div>
        </div>
        <div ref={scroller} aria-label="マーケット銘柄選択" className="flex shrink-0 snap-x gap-2 overflow-x-auto pb-1">
          {visibleMarkets.map(market => <button key={market.id} type="button" aria-pressed={item.id === market.id}
            onClick={event => { setHistoryOpen(false); setSelected(market.id); event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }}
            className={`min-h-10 shrink-0 snap-start rounded-xl border px-3 py-2 text-left transition-colors ${item.id === market.id ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-divider bg-surface text-body hover:border-emphasis'}`}>
            <span className="block text-xs font-semibold sm:text-sm">{market.title}</span>
          </button>)}
        </div>
        {onlyFavorites && visibleMarkets.length === 0 && <p className="py-3 text-xs text-muted">マーケットのお気に入りはまだありません。ダッシュボードの☆から登録できます。</p>}
        <section aria-label={`${item.title}の詳細`} className="mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-divider bg-surface p-2 shadow-sm">
          {item.symbol ? <>
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{item.title}</h3>
              {snapshot?.[item.id] && <button type="button" onClick={() => setHistoryOpen(true)} className="min-h-8 rounded-lg border border-divider px-2 text-[11px] text-accent">保存履歴</button>}
            </div>
            <TradingViewWidget fill key={item.symbol} item={{ id: item.symbol, title: item.title, subtitle: item.subtitle }} />
            <p className="mt-1 shrink-0 text-[10px] leading-relaxed text-muted" data-market-freshness>{item.symbol} · {item.freshness}。時点は公式表示に準拠。騰落＝選択期間（初期1Y）、帯＝日次。{MARKET_IDS.has(item.id) && ' ダッシュボード・保存履歴とは取得元／更新時点が異なり、価格が一致しない場合があります。'}</p>
          </> : snapshot?.[item.id] ? <>
            <ChartModal key={item.id} embedded isOpen seriesId={item.id} title={item.title} source={MARKET_ITEMS.find(market => market.id === item.id)?.source} unit={MARKET_ITEMS.find(market => market.id === item.id)?.unit} data={snapshot[item.id].observations} color="#3b82f6" onClose={() => {}} />
          </> : <div role="status" className="flex min-h-[160px] flex-col items-center justify-center gap-4 text-sm text-muted">
            <p>{status === 'error' ? '保存データを読み込めませんでした。' : '保存データを読み込み中…'}</p>
            {status === 'error' && <button type="button" onClick={() => { setStatus('loading'); setRetry(value => value + 1); }} className="flex min-h-11 items-center gap-2 rounded-xl border border-divider px-4 text-accent"><RefreshCw className="h-4 w-4" />再試行</button>}
          </div>}
        </section>

      </div>
    </main>
    <div aria-hidden="true" className="schedule-space shrink-0 border-t border-divider bg-canvas" />
    {historyOpen && snapshot?.[item.id] && <ChartModal isOpen seriesId={item.id} title={`${item.title} · 保存履歴`} data={snapshot[item.id].observations} color="#3b82f6" onClose={() => setHistoryOpen(false)} /> }
  </div>;
}
