import { BookOpenText, ChevronRight } from 'lucide-react';

export function EmploymentStoryEntry({ onOpen }: { onOpen: () => void }) {
  return (
    <section data-employment-story-entry className="mx-2 mb-2 flex flex-col gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-accent">直近の注目テーマ</p>
        <h2 className="mt-0.5 text-sm font-semibold text-ink sm:text-base">米国の雇用、まだ強い？</h2>
      </div>
      <button type="button" onClick={onOpen} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:min-h-10 sm:w-auto sm:px-3">
        <BookOpenText aria-hidden="true" className="h-4 w-4" />
        3つの数字を読み解く
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </section>
  );
}

