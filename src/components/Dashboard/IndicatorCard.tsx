import { FredSeriesData } from '@/lib/fred';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';
import { LineChartComponent } from '../Charts/LineChart';

interface Props {
  title: string;
  data: FredSeriesData;
}

export function IndicatorCard({ title, data }: Props) {
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

  const isInverse = title.includes('Unemployment') || title.includes('Claims') || title.includes('失業');
  const positiveColor = isInverse ? 'text-red-500' : 'text-green-500';
  const negativeColor = isInverse ? 'text-green-500' : 'text-red-500';
  const positiveChartColor = isInverse ? '#ef4444' : '#22c55e';
  const negativeChartColor = isInverse ? '#22c55e' : '#ef4444';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg flex flex-col gap-4 transition-all hover:-translate-y-1 cursor-default duration-300">
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-gray-400 font-medium text-base sm:text-sm w-3/4 leading-snug">{title}</h3>
        <span className="text-xs text-gray-500 whitespace-nowrap">{latest?.date}</span>
      </div>
      
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-3xl sm:text-2xl font-bold tracking-tight text-gray-100">
          {latest ? parseFloat(latest.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
        </span>
        
        {latest && previous && (
          <div className={`flex items-center text-sm font-medium ${isPositive ? positiveColor : isNegative ? negativeColor : 'text-gray-500'}`}>
            <span className="text-[10px] mr-1.5 px-1.5 py-0.5 border border-current rounded opacity-60 leading-none">{freqLabel}</span>
            {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : isNegative ? <ArrowDownIcon className="w-4 h-4" /> : <MinusIcon className="w-4 h-4" />}
            <span>{Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className="ml-1 opacity-80">({Math.abs(changePct).toFixed(2)}%)</span>
          </div>
        )}
      </div>

      <div className="h-28 w-full mt-2 -ml-2">
        <LineChartComponent data={obs} color={isPositive ? positiveChartColor : isNegative ? negativeChartColor : '#6b7280'} />
      </div>
    </div>
  );
}
