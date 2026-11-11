'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Layout/Header';
import { TodayHighlights } from '@/components/Dashboard/TodayHighlights';
import { SummaryGrid } from '@/components/Dashboard/SummaryGrid';
import { IndicatorCard } from '@/components/Dashboard/IndicatorCard';
import { CategoryTabs, CategoryKey } from '@/components/Dashboard/CategoryTabs';
import { FredSeriesData } from '@/lib/fred';
import { updateRealtimeFxClientSide } from '@/lib/clientFx';
import { syncLatestMacroDataClientSide } from '@/lib/clientLiveSync';
import { useIndicatorUpdates } from '@/hooks/useIndicatorUpdates';
import { useFavoriteIndicators } from '@/hooks/useFavoriteIndicators';
import { Loader2, AlertCircle, RefreshCw, Star } from 'lucide-react';

interface SeriesItem {
  id: string;
  title: string;
  category: CategoryKey;
}

const SERIES_ITEMS: SeriesItem[] = [
  // 為替・金利・市場スプレッド
  { id: 'DEXJPUS', title: 'ドル円 (USD/JPY)', category: 'rates_fx' },
  { id: 'DTWEXBGS', title: 'ドルインデックス (名目総合)', category: 'rates_fx' },
  { id: 'DEXUSEU', title: 'ユーロドル (EUR/USD)', category: 'rates_fx' },
  { id: 'FEDFUNDS', title: 'FF金利 (政策金利) (%)', category: 'rates_fx' },
  { id: 'DGS10', title: '10年国債利回り (%)', category: 'rates_fx' },
  { id: 'DGS2', title: '2年国債利回り (%)', category: 'rates_fx' },
  { id: 'T10Y2Y', title: '10年-2年金利差 (逆イールド) (%)', category: 'rates_fx' },
  { id: 'T10Y3M', title: '10年-3ヶ月金利差 (%)', category: 'rates_fx' },
  { id: 'DFII10', title: '10年実質金利 (TIPS) (%)', category: 'rates_fx' },
  { id: 'T10YIE', title: '10年期待インフレ率 (%)', category: 'rates_fx' },
  { id: 'BAMLH0A0HYM2', title: 'ハイイールド債スプレッド (%)', category: 'rates_fx' },

  // インフレ・物価
  { id: 'CPIAUCSL', title: '消費者物価指数 (CPI) [前年同月比]', category: 'inflation' },
  { id: 'CPILFESL', title: 'コアCPI [前年同月比]', category: 'inflation' },
  { id: 'PCEPI', title: 'PCEデフレーター [前年同月比]', category: 'inflation' },
  { id: 'PCEPILFE', title: 'コアPCEデフレーター [前年同月比]', category: 'inflation' },
  { id: 'WPSFD49207', title: '生産者物価指数 (PPI) [前年同月比]', category: 'inflation' },

  // 雇用
  { id: 'UNRATE', title: '失業率 (%)', category: 'employment' },
  { id: 'PAYEMS', title: '非農業部門雇用者数', category: 'employment' },
  { id: 'CES0500000003', title: '平均時給 [前年同月比]', category: 'employment' },
  { id: 'CIVPART', title: '労働参加率 (%)', category: 'employment' },
  { id: 'U6RATE', title: 'U-6広義失業率 (%)', category: 'employment' },
  { id: 'ICSA', title: '新規失業保険申請件数', category: 'employment' },
  { id: 'CCSA', title: '失業保険継続受給者数', category: 'employment' },
  { id: 'JTSJOL', title: 'JOLTS求人件数', category: 'employment' },

  // 株式・コモディティ・暗号資産
  { id: 'SP500', title: 'S&P 500', category: 'markets' },
  { id: 'NASDAQCOM', title: 'NASDAQ 総合指数', category: 'markets' },
  { id: 'DJIA', title: 'NYダウ (Dow Jones)', category: 'markets' },
  { id: 'VIXCLS', title: 'VIX 恐怖指数', category: 'markets' },
  { id: 'NIKKEI225', title: '日経平均株価 (円)', category: 'markets' },
  { id: 'CBBTCUSD', title: 'ビットコイン (BTC/USD)', category: 'markets' },
  { id: 'CBETHUSD', title: 'イーサリアム (ETH/USD)', category: 'markets' },
  { id: 'NASDAQXAU', title: '金・銀鉱山株指数 (PHLX XAU)', category: 'markets' },
  { id: 'DCOILWTICO', title: 'WTI 原油先物 (ドル/バレル)', category: 'markets' },
  { id: 'DHHNGSP', title: '天然ガス (Henry Hub USD/MMBtu)', category: 'markets' },

  // 景気・流動性
  { id: 'GDP', title: '実質国内総生産 (GDP) [前期比年率]', category: 'growth_liquidity' },
  { id: 'RSAFS', title: '小売売上高 [前月比]', category: 'growth_liquidity' },
  { id: 'INDPRO', title: '鉱工業生産指数', category: 'growth_liquidity' },
  { id: 'HOUST', title: '住宅着工件数', category: 'growth_liquidity' },
  { id: 'WALCL', title: 'FRB総資産 (Balance Sheet)', category: 'growth_liquidity' },
  { id: 'M2SL', title: 'マネーストック M2', category: 'growth_liquidity' },
  { id: 'UMCSENT', title: 'ミシガン大学消費者態度指数', category: 'growth_liquidity' }
];

const VALID_SERIES_IDS = new Set(SERIES_ITEMS.map(item => item.id));

export default function DashboardPage() {
  const { favorites, toggleFavorite, sessionOnly } = useFavoriteIndicators(VALID_SERIES_IDS);
  const [data, setData] = useState<Record<string, FredSeriesData>>({});
  const updatedIndicators = useIndicatorUpdates(data);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');

  const fetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/fred?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        // 1. クライアント側でリアルタイム補完
        let liveData = await updateRealtimeFxClientSide(json.data);
        // 2. 差分同期（リアルタイムピンポイントフェッチ）
        liveData = await syncLatestMacroDataClientSide(liveData);
        setData(liveData);

        if (isManual) {
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 2000);
        }
      } else {
        setError(json.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラー：データの取得に失敗しました');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const counts = useMemo(() => {
    const res: Record<CategoryKey, number> = {
      all: SERIES_ITEMS.length,
      favorites: favorites.size,
      rates_fx: 0,
      inflation: 0,
      employment: 0,
      markets: 0,
      growth_liquidity: 0
    };
    SERIES_ITEMS.forEach(item => {
      if (res[item.category] !== undefined) {
        res[item.category]++;
      }
    });
    return res;
  }, [favorites.size]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return SERIES_ITEMS;
    if (selectedCategory === 'favorites') return SERIES_ITEMS.filter(item => favorites.has(item.id));
    return SERIES_ITEMS.filter(item => item.category === selectedCategory);
  }, [selectedCategory, favorites]);

  return (
    <div className="h-dvh min-h-0 flex flex-col overflow-hidden bg-canvas">
      <Header />
      <main className="min-h-0 flex-1 w-full overflow-y-auto py-4 md:py-8">
        <div className="mx-auto w-full max-w-[1400px] px-2 md:px-6">
        
        {/* タイトル＆リフレッシュボタン */}
        <div className="mb-4 md:mb-6 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="flex flex-wrap gap-x-1.5 text-2xl sm:text-3xl font-bold leading-snug text-ink tracking-tight lg:tracking-normal">
              <span className="inline-block">米経済指標</span><span className="inline-block">ダッシュボード</span>
            </h2>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={loading || isRefreshing}
            className={`self-start sm:self-center flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-sm ${
              justUpdated
                ? 'bg-green-600/20 border-green-500/40 text-positive'
                : 'bg-surface/90 hover:bg-raised border-divider text-body hover:text-ink'
            }`}
            aria-label="データを再取得"
          >
            <RefreshCw className={`w-4 h-4 ${justUpdated ? 'text-positive' : 'text-accent'} ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '更新中...' : justUpdated ? '✅ 最新に更新完了' : '最新データを取得'}</span>
          </button>
        </div>

        </div>

        <TodayHighlights />

        <div className="mx-auto w-full max-w-[1400px] px-2 md:px-6">

        {/* カテゴリ別タブフィルター */}
        <div className="mb-4 md:mb-6 px-2">
          <CategoryTabs 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
            counts={counts} 
          />
        </div>

        {sessionOnly && (
          <p role="status" className="mx-2 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-warning">
            このブラウザーではお気に入りを保存できません。今は使えますが、再読み込みすると解除されます。
          </p>
        )}

        {/* ローディング表示 */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm">マクロ経済データを読み込み中...</p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-negative flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && selectedCategory === 'favorites' && favorites.size === 0 && (
          <div className="mx-2 rounded-2xl border border-divider bg-surface px-5 py-10 text-center sm:px-8">
            <Star aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-warning" />
            <h3 className="text-base font-semibold text-ink sm:text-lg">まだお気に入りがありません</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              カード右上の☆を押すと、気になる指標をここにまとめられます。
            </p>
            <p className="mt-1 text-xs text-muted">このブラウザーに保存されます。他の端末には引き継がれません。</p>
            <button type="button" onClick={() => setSelectedCategory('all')}
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              すべての指標から選ぶ
            </button>
          </div>
        )}

        {/* メイン指標グリッド */}
        {!loading && !error && (
          <SummaryGrid>
            {filteredItems.map((item) => {
              const seriesData = data[item.id];
              if (!seriesData) return null;
              return (
                <IndicatorCard 
                  key={item.id} 
                  title={item.title} 
                  data={seriesData}
                  isFavorite={favorites.has(item.id)}
                  isUpdated={updatedIndicators.has(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              );
            })}
          </SummaryGrid>
        )}
        </div>
      </main>
      <div aria-hidden="true" className="schedule-space shrink-0 border-t border-divider bg-canvas" />
    </div>
  );
}
