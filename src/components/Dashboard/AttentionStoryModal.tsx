'use client';

import { useEffect, useRef } from 'react';
import { BriefcaseBusiness, CalendarDays, Flame, X } from 'lucide-react';
import type { EmploymentStory } from '@/lib/employmentStory';
import type { InflationStory } from '@/lib/inflationStory';
import type { AttentionTheme } from '@/hooks/useAttentionStoryNotice';

type Story = EmploymentStory | InflationStory;

function statusClass(story: Story) {
  if (story.status === 'strong' || story.status === 'cooling') return 'bg-green-500/10 text-positive';
  if (story.status === 'weak' || story.status === 'heating') return 'bg-red-500/10 text-negative';
  if (story.status === 'hold') return 'bg-amber-500/10 text-warning';
  return 'bg-blue-500/10 text-accent';
}

export function AttentionStoryModal({ theme, story, onClose }: { theme: AttentionTheme; story: Story; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const employment = theme === 'employment';
  const title = employment ? '米国の雇用、まだ強い？' : '米国の物価、落ち着いてきた？';
  const Icon = employment ? BriefcaseBusiness : Flame;

  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const dateText = employment
    ? `雇用者数 ${(story as EmploymentStory).dataDates.payrolls ?? '不足'} ／ 失業保険申請 ${(story as EmploymentStory).dataDates.claims ?? '不足'} ／ 失業率 ${(story as EmploymentStory).dataDates.unemployment ?? '不足'}`
    : `CPI ${(story as InflationStory).dataDates.headlineCpi ?? '不足'} ／ コアCPI ${(story as InflationStory).dataDates.coreCpi ?? '不足'} ／ コアPCE ${(story as InflationStory).dataDates.corePce ?? '不足'}`;

  return (
    <dialog ref={ref} aria-labelledby="attention-story-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="m-0 mt-auto max-h-[86dvh] w-full max-w-none flex-col rounded-t-3xl border border-divider bg-surface p-0 text-body shadow-2xl backdrop:bg-black/65 backdrop:backdrop-blur-sm open:flex sm:m-auto sm:max-h-[82vh] sm:max-w-2xl sm:rounded-2xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-divider px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-accent"><Icon aria-hidden="true" className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="text-xs font-semibold text-accent">3つの数字を読み解く</p><h2 id="attention-story-title" className="mt-0.5 text-lg font-bold leading-snug text-ink sm:text-xl">{title}</h2></div>
        </div>
        <button type="button" aria-label={`${title}を閉じる`} onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-muted hover:text-ink"><X aria-hidden="true" className="h-5 w-5" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="rounded-xl bg-canvas px-3 py-3">
          <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${statusClass(story)}`}>{story.statusLabel}</span>
          <p className="mt-2 text-sm leading-relaxed text-body">{story.summary}</p>
        </div>

        <div className="mt-4 space-y-4">
          {story.sections.map((section, index) => (
            <section key={section.title} className="border-t border-divider pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span><h3 className="font-semibold text-ink">{section.title}</h3></div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{section.description}</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-body">
                {section.lines.map(line => <li key={line} className="flex gap-2"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /><span>{line}</span></li>)}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-divider bg-raised/40 p-3 text-[11px] leading-relaxed text-muted">
          <p className="flex items-start gap-1.5"><CalendarDays aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /><span>観測日：{dateText}</span></p>
          <p className="mt-1">表示した日付は各系列の観測期間の基準日です。発表日・更新日ではありません。金利・株価・売買の方向を示すものではありません。</p>
        </div>
      </div>
    </dialog>
  );
}
