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
  return <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
    <div className="shrink-0"><Header /></div>
    <main className="min-h-0 flex-1 overflow-y-auto" id="market-content">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-5">
        <h2 className="flex items-center gap-2 text-xl font-bold sm:text-3xl"><ChartNoAxesCombined className="h-5 w-5 text-accent sm:h-7 sm:w-7" />マーケット</h2>
        <span className="rounded-full border border-divider bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted">14銘柄</span>
      </div>
      <MarketTicker />
      <div className="mx-auto max-w-[1400px] px-4 pb-6 pt-3 sm:px-6 sm:pt-5">
        <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold text-muted">銘柄を選ぶ <span className="ml-1 font-normal">／ 横にスワイプ</span></h3>
          <div className="flex items-center gap-1">
            <button type="button" aria-pressed={onlyFavorites} onClick={() => { const next = !onlyFavorites; setOnlyFavorites(next); const first = PROTOTYPE_MARKETS.find(market => favorites.has(market.id)); if (next && first && !favorites.has(selected)) setSelected(first.id); }} className={`inline-flex min-h-8 items-center gap-1 rounded-lg border px-2 text-[10px] ${onlyFavorites ? 'border-blue-600 bg-blue-600 text-white' : 'border-divider bg-surface text-muted'}`}><Star className="h-3 w-3" />お気に入り {favorites.size}</button>
          <div className="hidden gap-1 sm:flex">{[-1, 1].map(direction => <button key={direction} type="button" aria-label={direction < 0 ? '前の銘柄へスクロール' : '次の銘柄へスクロール'} onClick={() => scroller.current?.scrollBy({ left: direction * 400, behavior: 'smooth' })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-divider bg-surface text-muted">{direction < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>)}</div></div>
        </div>
        <div ref={scroller} aria-label="マーケット銘柄選択" className="flex snap-x gap-2 overflow-x-auto pb-2">
          {visibleMarkets.map(market => <button key={market.id} type="button" aria-pressed={item.id === market.id}
            onClick={event => { setSelected(market.id); event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }}
            className={`min-h-14 shrink-0 snap-start rounded-xl border px-4 py-2 text-left transition-colors ${item.id === market.id ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-divider bg-surface text-body hover:border-emphasis'}`}>
            <span className="block text-xs font-semibold sm:text-sm">{market.title}</span><span className={`mt-0.5 block text-[10px] ${item.id === market.id ? 'text-blue-100' : 'text-muted'}`}>{['NVDA', 'GOLD'].includes(market.id) ? 'TradingView' : '保存データ'}</span>
          </button>)}
        </div>
        {onlyFavorites && visibleMarkets.length === 0 && <p className="py-3 text-xs text-muted">マーケットのお気に入りはまだありません。ダッシュボードの☆から登録できます。</p>}
        <section aria-label={`${item.title}の詳細`} className="mt-2 rounded-2xl border border-divider bg-surface p-3 shadow-sm sm:mt-3 sm:p-5">
          {['NVDA', 'GOLD'].includes(item.id) ? <>
            <div className="mb-3 flex items-start justify-between gap-2"><div><h3 className="text-base font-bold sm:text-xl">{item.title}</h3><p className="mt-0.5 text-[10px] text-muted sm:text-xs">{item.subtitle}</p></div><span className="rounded-md bg-raised px-2 py-1 text-[10px] text-muted">初期表示 1Y</span></div>
            <TradingViewWidget key={item.symbol} item={{ id: item.symbol!, title: item.title, subtitle: item.subtitle }} />
            <p className="mt-2 text-[10px] leading-relaxed text-muted sm:text-xs">グラフの騰落は選択期間の変化です（初期は過去1年）。前日比とは異なります。価格・遅延は各提供元の仕様に従います。</p>
          </> : snapshot?.[item.id] ? <>
            <ChartModal key={item.id} embedded isOpen seriesId={item.id} title={item.title} unit={MARKET_ITEMS.find(market => market.id === item.id)?.unit} data={snapshot[item.id].observations} color="#3b82f6" onClose={() => {}} />
            <p className="mt-3 text-[10px] leading-relaxed text-muted sm:text-xs">取得元：{MARKET_ITEMS.find(market => market.id === item.id)?.source} ／ {MARKET_ITEMS.find(market => market.id === item.id)?.unit}。日次の保存データで、リアルタイム価格ではありません。</p>
          </> : <div role="status" className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-sm text-muted">
            <p>{status === 'error' ? '保存データを読み込めませんでした。' : '保存データを読み込み中…'}</p>
            {status === 'error' && <button type="button" onClick={() => { setStatus('loading'); setRetry(value => value + 1); }} className="flex min-h-11 items-center gap-2 rounded-xl border border-divider px-4 text-accent"><RefreshCw className="h-4 w-4" />再試行</button>}
          </div>}
        </section>
        <p className="mt-3 text-[10px] leading-relaxed text-muted sm:text-xs">為替・暗号資産は記載の提供元の価格で、FRED保存値とは異なる場合があります。帯は公式表示を確認できた銘柄のみ。詳細は既存12銘柄＝保存データ、NVDA・金＝TradingViewです。帯と一覧は完全一致しません。</p>
      </div>
    </main>
    <div aria-hidden="true" className="h-20 shrink-0 border-t border-divider bg-canvas" />
  </div>;
}
