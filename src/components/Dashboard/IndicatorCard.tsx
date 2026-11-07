import { FredSeriesData } from '@/lib/fred';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, ArrowUpRight } from 'lucide-react';
import { LineChartComponent } from '../Charts/LineChart';
import { useState } from 'react';
import { ChartModal } from './ChartModal';

interface Props {
  title: string;
  data: FredSeriesData;
}

export function IndicatorCard({ title, data }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const obs = data.observations;
  const latest = obs.length > 0 ? obs[obs.length - 1] : null;
  const previous = obs.length > 1 ? obs[obs.length - 2] : null;

  let change = 0;
  let changePct = 0;
  let freqLabel = '前回比';

  if (latest && previous) {
    const lVal = parseFloat(latest.value);
    const pVal = parseFloat(previous.value);
    change = lVal - pVal;
    changePct = (change / pVal) * 100;

    const d1 = new Date(previous.date);
    const d2 = new Date(latest.date);
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 4) freqLabel = '前営業日比';
    else if (diffDays <= 10) freqLabel = '前週比';
    else if (diffDays <= 40) freqLabel = '前月比';
    else if (diffDays <= 100) freqLabel = '前期比';
    else freqLabel = '前年比';
  }

  const isPositive = change > 0;
  const isNegative = change < 0;

  const isInverse = title.includes('Unemployment') || title.includes('Claims') || title.includes('失業') || title.includes('ハイイールド') || title.includes('VIX');
  const positiveColor = isInverse ? 'text-red-500' : 'text-green-500';
  const negativeColor = isInverse ? 'text-green-500' : 'text-red-500';
  const positiveChartColor = isInverse ? '#ef4444' : '#22c55e';
  const negativeChartColor = isInverse ? '#22c55e' : '#ef4444';

  // グラフ全体の色は大局トレンド（開始値 vs 最新値）で判定
  const firstObs = obs.length > 0 ? obs[0] : null;
  let overallChange = 0;
  if (firstObs && latest) {
    overallChange = parseFloat(latest.value) - parseFloat(firstObs.value);
  }
  const isOverallPositive = overallChange >= 0;
  const chartColor = isOverallPositive ? positiveChartColor : negativeChartColor;

  const isYieldCurve = data.seriesId === 'T10Y2Y' || data.seriesId === 'T10Y3M';
  const latestValNum = latest ? parseFloat(latest.value) : 0;
  const isInverted = isYieldCurve && latestValNum < 0;

  return (
    <>
      <article className="group relative flex min-w-0 flex-col rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-sm transition-colors hover:border-gray-600 sm:p-5">
        <div className="min-h-12">
          <h3 className="break-words text-sm font-medium leading-6 text-gray-300 sm:text-base">{title}</h3>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium tracking-wide text-gray-400">最新値</span>
          {isInverted && (
            <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
              逆イールド
            </span>
          )}
        </div>
        <div className="mt-1 break-all text-3xl font-bold leading-tight tracking-tight text-gray-100 tabular-nums sm:text-4xl">
          {latest ? parseFloat(latest.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
        </div>

        <div className="mt-3 min-h-12">
          {latest && previous ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-xs text-gray-400">{freqLabel}</span>
              <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${isPositive ? positiveColor : isNegative ? negativeColor : 'text-gray-400'}`}>
                {isPositive ? <ArrowUpIcon aria-label="上昇" className="h-4 w-4 shrink-0" /> : isNegative ? <ArrowDownIcon aria-label="低下" className="h-4 w-4 shrink-0" /> : <MinusIcon aria-label="変化なし" className="h-4 w-4 shrink-0" />}
                {Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-gray-400 tabular-nums">({Math.abs(changePct).toFixed(2)}%)</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">比較データなし</span>
          )}
          <p className="mt-1 text-xs text-gray-400">データ日：{latest?.date ?? '—'}</p>
        </div>

        <div className="mt-4 h-28 w-full min-w-0" aria-hidden="true">
          <LineChartComponent data={obs} color={chartColor} />
        </div>
        <div className="mt-4 flex justify-end border-t border-gray-800 pt-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-blue-400 transition-colors before:absolute before:inset-0 before:rounded-2xl hover:text-blue-300 focus-visible:outline-none focus-visible:before:ring-2 focus-visible:before:ring-blue-400"
            onClick={() => setIsModalOpen(true)}
            aria-label={`${title}のグラフを見る`}
            aria-haspopup="dialog"
          >
            グラフを見る <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </article>
      <ChartModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={title} 
        data={obs} 
        color={chartColor} 
      />
    </>
  );
}
