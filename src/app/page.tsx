'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { SummaryGrid } from '@/components/Dashboard/SummaryGrid';
import { IndicatorCard } from '@/components/Dashboard/IndicatorCard';
import { FredSeriesData } from '@/lib/fred';
import { Loader2, AlertCircle } from 'lucide-react';

const SERIES_TITLES: Record<string, string> = {
  CPIAUCSL: '消費者物価指数 (CPI) [前年同月比]',
  CPILFESL: 'コアCPI [前年同月比]',
  PCEPI: 'PCEデフレーター [前年同月比]',
  WPSFD49207: '生産者物価指数 (PPI) [前年同月比]',
  UNRATE: '失業率 (%)',
  PAYEMS: '非農業部門雇用者数',
  ICSA: '新規失業保険申請件数',
  JTSJOL: 'JOLTS求人件数',
  GDP: '実質国内総生産 (GDP) [前期比年率]',
  RSAFS: '小売売上高 [前月比]',
  HOUST: '住宅着工件数',
  INDPRO: '鉱工業生産指数',
  FEDFUNDS: 'FF金利 (政策金利) (%)',
  DGS10: '10年国債利回り (%)',
  DGS2: '2年国債利回り (%)',
  M2SL: 'マネーストック M2',
  UMCSENT: 'ミシガン大学消費者態度指数'
};

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, FredSeriesData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/fred');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load data');
        }
      } catch (err) {
        setError('ネットワークエラー：データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1400px] w-full mx-auto py-4 md:py-8 px-1 md:px-6">
        
        <div className="mb-4 md:mb-6 px-2 md:px-4 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 tracking-tighter">イチの米経済指標ダッシュボード</h2>
          <p className="text-gray-400 mt-2 text-base md:text-base">FRED APIを通じて米国の主要なマクロ経済指標を時系列で可視化します。</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p>マクロ経済データを読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <SummaryGrid>
            {Object.entries(SERIES_TITLES).map(([id, title]) => {
              const seriesData = data[id];
              if (!seriesData) return null;
              return <IndicatorCard key={id} title={title} data={seriesData} />;
            })}
          </SummaryGrid>
        )}
      </main>
    </div>
  );
}
