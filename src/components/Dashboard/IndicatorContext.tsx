import { ChevronDown, Link2 } from 'lucide-react';
import { getIndicatorContext } from '@/lib/indicatorContext';

export function IndicatorContext({ seriesId }: { seriesId: string }) {
  const context = getIndicatorContext(seriesId);
  if (!context) return null;

  return (
    <details data-indicator-context className="group relative z-10 mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-blue-500/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Link2 aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>関連して見る</span>
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-blue-500/15 px-3 py-2.5 text-xs leading-relaxed text-body">
        <p><span className="mr-2 font-medium text-accent">一緒に見る</span>{context.related}</p>
        <p className="mt-1.5"><span className="mr-2 font-medium text-accent">確認点</span>{context.check}</p>
      </div>
    </details>
  );
}

