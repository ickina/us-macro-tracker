import { X, Calendar } from 'lucide-react';
import { Observation } from '@/lib/fred';
import { LineChartComponent } from '../Charts/LineChart';
import { useEffect, useState, useMemo } from 'react';
import { isValidHistory, mergeChartHistory, timeframeStart } from '@/lib/chartHistory';

type Timeframe = '1Y' | '3Y' | '5Y' | '10Y' | 'ALL';

interface Props {
  isOpen: boolean;
  embedded?: boolean;
  unit?: string;
  seriesId: string;
  onClose: () => void;
  title: string;
  data: Observation[];
  color: string;
}

export function ChartModal(props: Props) {
  if (!props.isOpen) return null;
  return <OpenChartModal key={props.seriesId} {...props} />;
}

function OpenChartModal({ isOpen, onClose, title, data, seriesId, embedded = false, unit }: Props) {
  const [history, setHistory] = useState<Observation[]>([]);
  const [historyStatus, setHistoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    fetch(`/history/${encodeURIComponent(seriesId)}.json`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('History unavailable');
        const result: unknown = await response.json();
        if (!isValidHistory(result, seriesId)) throw new Error('Invalid history');
        if (active) { setHistory(result.observations); setHistoryStatus('ready'); }
      })
      .catch(() => { if (active) setHistoryStatus('error'); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [seriesId]);

  const fullData = useMemo(() => mergeChartHistory(history, data), [history, data]);
  const [preferredTimeframe, setTimeframe] = useState<Timeframe>('1Y');

  // ESCキーで閉じる処理、背景スクロール防止
  useEffect(() => {
    if (!isOpen || embedded) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, embedded]);

  const isAvailable = (tf: Timeframe) => {
    if (tf === 'ALL') return true;
    if (fullData.length < 2) return false;
    const start = new Date(`${timeframeStart(fullData[fullData.length - 1].date, Number(tf.slice(0, -1)))}T00:00:00Z`);
    // Allow a trading-week gap at the left edge for weekends and market holidays.
    start.setUTCDate(start.getUTCDate() + 7);
    return fullData[0].date <= start.toISOString().slice(0, 10);
  };

  const timeframe = isAvailable(preferredTimeframe) ? preferredTimeframe : 'ALL';

  const filteredData = useMemo(() => {
    if (fullData.length === 0 || timeframe === 'ALL') return fullData;
    const start = timeframeStart(fullData[fullData.length - 1].date, Number(timeframe.slice(0, -1)));
    return fullData.filter(item => item.date >= start);
  }, [fullData, timeframe]);

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

  const previous = fullData.at(-2);
  const latestChange = previous ? stats.latest - Number(previous.value) : null;

  const timeframes: Timeframe[] = ['1Y', '3Y', '5Y', '10Y', 'ALL'];

  return (
    <div
      className={embedded ? "w-full min-w-0" : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity"}
      onClick={embedded ? undefined : onClose}
    >
      <div
        role={embedded ? undefined : "dialog"} aria-modal={embedded ? undefined : true} aria-label={title}
        className={embedded ? "flex w-full min-w-0 flex-col" : "bg-surface border border-strong rounded-2xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto"}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        {!embedded && <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-ink bg-raised hover:bg-raised-hover rounded-full transition-colors z-10 cursor-pointer"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>}

        {/* ヘッダー情報 */}
        <div className={embedded ? "mb-2" : "pr-10 mb-4"}>
          <h3 className="text-lg sm:text-2xl font-bold text-ink leading-snug">{title}</h3>

          {embedded && <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="text-2xl tabular-nums sm:text-3xl">{stats.latest.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</strong>
            {unit && <span className="text-xs text-muted">{unit}</span>}
            {latestChange !== null && <span className="text-xs text-muted">前回比 {latestChange > 0 ? '+' : ''}{latestChange.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</span>}
          </div>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs sm:text-sm text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              {stats.start} 〜 {stats.end} ({filteredData.length}件)
            </span>
            <span className="text-muted hidden sm:inline">|</span>
            <span>高値: <strong className="text-ink">{stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>
            <span>安値: <strong className="text-ink">{stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* 期間切り替えボタン */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 self-start sm:self-end bg-canvas/60 p-1 rounded-xl border border-divider">
          {timeframes.map((tf) => (
            <button
              key={tf}
              type="button"
              disabled={!isAvailable(tf)}
              aria-pressed={timeframe === tf}
              title={!isAvailable(tf) ? 'この期間のデータがありません' : tf === 'ALL' ? '取得済みの全期間' : `${tf.slice(0, -1)}年間`}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-muted hover:text-ink hover:bg-raised disabled:cursor-not-allowed disabled:opacity-35'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <p role="status" className="mb-1 text-xs leading-relaxed text-muted">
          {historyStatus === 'loading' ? '長期データを読み込み中…' : historyStatus === 'error'
            ? '長期データを読み込めませんでした。保存済みの範囲を表示しています。開き直すと再試行できます。'
            : embedded ? 'ALL＝取得済みの全期間' : 'ALLは取得済みの全期間です。履歴が足りない期間は選択できません。'}
          {filteredData.length > 800 && ' グラフは高値・安値を残して間引き表示しています。'}
        </p>

        {/* チャート描画領域 */}
        <div className={embedded ? "h-[34dvh] min-h-48 w-full shrink-0 mt-2 sm:h-[38dvh]" : "h-[40vh] min-h-48 shrink-0 sm:h-[50vh] w-full mt-2"}>
          <LineChartComponent data={filteredData} color={activeColor} showXAxis={true} />
        </div>
      </div>
    </div>
  );
}
