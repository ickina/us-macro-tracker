'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Layout/Header';
import { SummaryGrid } from '@/components/Dashboard/SummaryGrid';
import { IndicatorCard } from '@/components/Dashboard/IndicatorCard';
import { CategoryTabs, CategoryKey } from '@/components/Dashboard/CategoryTabs';
import { FredSeriesData } from '@/lib/fred';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

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

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, FredSeriesData>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');

  const fetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fred');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
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
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return SERIES_ITEMS;
    return SERIES_ITEMS.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-[#030712]">
      <Header />
      <main className="flex-1 max-w-[1400px] w-full mx-auto py-4 md:py-8 px-2 md:px-6">
        
        {/* タイトル＆リフレッシュボタン */}
        <div className="mb-4 md:mb-6 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tighter">
              イチの米経済指標ダッシュボード
            </h2>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              FRED APIを通じて米国の主要マクロ経済指標（全{SERIES_ITEMS.length}項目）を可視化します。
            </p>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={loading || isRefreshing}
            className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-sm"
            aria-label="データを再取得"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '更新中...' : '最新データを取得'}</span>
          </button>
        </div>

        {/* カテゴリ別タブフィルター */}
        <div className="mb-4 md:mb-6 px-2">
          <CategoryTabs 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
            counts={counts} 
          />
        </div>

        {/* ローディング表示 */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">マクロ経済データを読み込み中...</p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
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
                />
              );
            })}
          </SummaryGrid>
        )}
      </main>
    </div>
  );
}
