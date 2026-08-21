import { X, Calendar } from 'lucide-react';
import { Observation } from '@/lib/fred';
import { LineChartComponent } from '../Charts/LineChart';
import { useEffect, useState, useMemo } from 'react';

type Timeframe = '1Y' | '3Y' | '5Y' | '10Y' | 'ALL';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Observation[];
  color: string;
}

export function ChartModal({ isOpen, onClose, title, data, color }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');

  // ESCキーで閉じる処理、背景スクロール防止
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // モーダルが開かれたらデフォルトはALLにリセット
  useEffect(() => {
    if (isOpen) {
      setTimeframe('ALL');
    }
  }, [isOpen]);

  // 選択されたタイムフレームでデータをフィルタリング
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeframe === 'ALL') return data;

    const latestDate = new Date(data[data.length - 1].date);
    const targetDate = new Date(latestDate);

    if (timeframe === '1Y') targetDate.setFullYear(targetDate.getFullYear() - 1);
    else if (timeframe === '3Y') targetDate.setFullYear(targetDate.getFullYear() - 3);
    else if (timeframe === '5Y') targetDate.setFullYear(targetDate.getFullYear() - 5);
    else if (timeframe === '10Y') targetDate.setFullYear(targetDate.getFullYear() - 10);

    const filtered = data.filter(d => new Date(d.date) >= targetDate);
    return filtered.length > 0 ? filtered : data;
  }, [data, timeframe]);

  // 統計情報 (最高値、最安値、最新値、日付範囲)
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { start: '', end: '', min: 0, max: 0, latest: 0 };
    }
    const values = filteredData.map(d => parseFloat(d.value)).filter(v => !isNaN(v));
    return {
      start: filteredData[0].date,
      end: filteredData[filteredData.length - 1].date,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }, [filteredData]);

  if (!isOpen) return null;

  const isInverse = title.includes('Unemployment') || title.includes('Claims') || title.includes('失業') || title.includes('ハイイールド') || title.includes('VIX');
  const startVal = filteredData.length > 0 ? parseFloat(filteredData[0].value) : 0;
  const isPeriodPositive = stats.latest >= startVal;
  const activeColor = isInverse 
    ? (isPeriodPositive ? '#ef4444' : '#22c55e')
    : (isPeriodPositive ? '#22c55e' : '#ef4444');

  const timeframes: Timeframe[] = ['1Y', '3Y', '5Y', '10Y', 'ALL'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors z-10 cursor-pointer"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* ヘッダー情報 */}
        <div className="pr-10 mb-4">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-100 leading-snug">{title}</h3>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs sm:text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {stats.start} 〜 {stats.end} ({filteredData.length}件)
            </span>
            <span className="text-gray-500 hidden sm:inline">|</span>
            <span>高値: <strong className="text-gray-200">{stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>
            <span>安値: <strong className="text-gray-200">{stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* 期間切り替えボタン */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 self-start sm:self-end bg-gray-950/60 p-1 rounded-xl border border-gray-800">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {/* チャート描画領域 */}
        <div className="h-[45vh] sm:h-[55vh] w-full -ml-2 sm:-ml-4 mt-2 flex-1">
          <LineChartComponent data={filteredData} color={activeColor} showXAxis={true} />
        </div>
      </div>
    </div>
  );
}
