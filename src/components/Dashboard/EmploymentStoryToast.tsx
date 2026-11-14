import { BriefcaseBusiness, ChevronRight, X } from 'lucide-react';

export function EmploymentStoryToast({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  return (
    <aside role="status" aria-live="polite" className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+7.75rem)] z-50 sm:left-auto sm:right-6 sm:w-[370px] lg:top-20">
      <div className="story-toast pointer-events-auto rounded-2xl border border-blue-500/30 bg-surface/95 p-3 shadow-[0_16px_45px_rgba(15,23,42,0.24)] backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-accent">
            <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-accent">新しい読み解きが届いています</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-ink">米国の雇用、まだ強い？</p>
          </div>
          <button type="button" onClick={onDismiss} aria-label="新しい読み解きの通知を閉じる" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={onOpen} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
          見る
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
