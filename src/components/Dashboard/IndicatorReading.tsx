import type { IndicatorReading as Reading } from '@/lib/indicatorReading';

export function IndicatorReading({ reading }: { reading: Reading }) {
  const { range } = reading;
  const format = (value: number) => value.toLocaleString('ja-JP', { maximumFractionDigits: reading.digits });
  const suffix = reading.unit === '％' ? '％' : '';
  const label = range?.fullYear ? '過去1年の位置' : '保存期間内の位置';
  return <section aria-label="数字の読み方" data-indicator-reading className="relative z-10 mt-3 rounded-xl bg-blue-500/5 p-3">
    {range ? <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs"><span className="text-muted">{label}</span><strong className="font-semibold text-body">{range.label}</strong></div>
      <div className="relative my-2 h-2 rounded-full bg-blue-500/15" role={range.position === null ? undefined : 'meter'}
        aria-label={range.position === null ? undefined : label} aria-valuemin={range.position === null ? undefined : range.min} aria-valuemax={range.position === null ? undefined : range.max} aria-valuenow={range.position === null ? undefined : range.latest} aria-valuetext={range.position === null ? undefined : `${range.label}。${format(range.latest)} ${reading.unit}`}>
        <span aria-hidden="true" className="absolute -top-0.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-surface bg-accent shadow-sm" style={{ left: `clamp(6px, ${(range.position ?? 0.5) * 100}%, calc(100% - 6px))` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] leading-4 text-muted"><span>最低 {format(range.min)}{suffix}</span><span>最高 {format(range.max)}{suffix}</span></div>
    </> : <p className="text-xs text-muted">位置を比べるデータがまだ足りません。</p>}
    <details className="mt-1 text-xs leading-relaxed text-muted">
      <summary className="cursor-pointer py-1"><span className="font-medium text-accent">読み方</span>{range && <span className="ml-2 text-[11px]">{range.start}〜{range.end}</span>}</summary>
      <p className="mt-1 text-body">{reading.definition}</p><p className="mt-1">{reading.reading}</p>
      {range && <p className="mt-2">{range.fullYear ? 'データ日を終点にした1年' : '1年分がないため、保存されている期間'}を比べています。点が左ほどこの期間の最低値に近く、右ほど最高値に近い位置です。</p>}
      <p className="mt-1">「高め・低め」は、この期間の数字の位置です。良し悪しや割高・割安の判定ではありません。</p>
    </details>
  </section>;
}
