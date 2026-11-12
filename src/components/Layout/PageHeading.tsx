import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// Shared spacing and typography keep all three page titles aligned.
export function PageHeading({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return <div data-page-heading className="mx-auto flex w-full max-w-[1400px] shrink-0 items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:py-4">
    <h2 className="flex min-w-0 items-center gap-2 whitespace-nowrap text-[22px] font-bold leading-8 tracking-tight text-ink sm:text-2xl lg:text-[28px] lg:leading-9">
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-accent sm:h-6 sm:w-6" /><span>{title}</span>
    </h2>
    <div className="shrink-0 [&>button]:min-h-10">{children}</div>
  </div>;
}
