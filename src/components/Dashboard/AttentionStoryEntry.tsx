import { BookOpenText, ChevronRight, Flame, BriefcaseBusiness } from 'lucide-react';
import type { RateCutView } from '@/lib/rateCutView';
import type { AttentionTheme } from '@/hooks/useAttentionStoryNotice';

const THEME_COPY = {
  employment: { label: '雇用', question: '米国の雇用、まだ強い？', icon: BriefcaseBusiness },
  inflation: { label: '物価', question: '米国の物価、落ち着いてきた？', icon: Flame },
} as const;

function rateClass(status: RateCutView['status']) {
  if (status === 'tailwind') return 'bg-green-500/10 text-positive border-green-500/20';
  if (status === 'headwind') return 'bg-red-500/10 text-negative border-red-500/20';
  if (status === 'hold') return 'bg-amber-500/10 text-warning border-amber-500/20';
  return 'bg-blue-500/10 text-accent border-blue-500/20';
}

export function AttentionStoryEntry({
  theme,
  onSelectTheme,
  onOpen,
  rateCutView,
  themeHasUpdate,
}: {
  theme: AttentionTheme;
  onSelectTheme: (theme: AttentionTheme) => void;
  onOpen: () => void;
  rateCutView: RateCutView;
  themeHasUpdate: Record<AttentionTheme, boolean>;
}) {
  const copy = THEME_COPY[theme];

  return (
    <section data-attention-story-entry className="mx-2 mb-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-accent">直近の注目テーマ</p>
          <h2 className="mt-0.5 text-sm font-bold text-ink sm:text-base">{copy.question}</h2>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div aria-label="注目テーマを選ぶ" className="grid min-w-0 flex-1 grid-cols-2 rounded-xl border border-divider bg-surface p-1 sm:flex-none">
            {(Object.keys(THEME_COPY) as AttentionTheme[]).map(item => {
              const itemCopy = THEME_COPY[item];
              const Icon = itemCopy.icon;
              const active = item === theme;
              return (
                <button key={item} type="button" aria-pressed={active} onClick={() => onSelectTheme(item)}
                  className={`relative inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-muted hover:bg-raised hover:text-ink'}`}>
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {itemCopy.label}
                  {themeHasUpdate[item] && !active && <span aria-label="更新あり" className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={onOpen} aria-label={`${copy.question} 3つの数字を読み解く`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:min-h-10 sm:text-sm">
            <BookOpenText aria-hidden="true" className="h-4 w-4" />
            <span>読み解く</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-blue-500/15 pt-3 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-2 sm:w-40">
          <span className="text-xs font-semibold text-muted">利下げへの材料</span>
          <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${rateClass(rateCutView.status)}`}>{rateCutView.label}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-relaxed text-body sm:text-sm">{rateCutView.summary}</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted sm:text-[11px]">{rateCutView.checkNote}</p>
        </div>
      </div>
    </section>
  );
}
