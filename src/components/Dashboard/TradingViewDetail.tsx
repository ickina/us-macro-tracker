'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { TradingViewMarket } from '@/lib/tradingViewMarkets';
import { TradingViewWidget } from './TradingViewWidget';

export default function TradingViewDetail({ item, onClose }: { item: TradingViewMarket; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return <dialog ref={ref} aria-labelledby="tv-detail-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="m-auto max-h-[92dvh] w-[calc(100%-24px)] max-w-4xl overflow-y-auto rounded-2xl border border-strong bg-surface p-4 text-ink shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:p-6">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0"><h2 id="tv-detail-title" className="text-lg font-bold sm:text-2xl">{item.title}</h2>
        <p className="mt-1 text-xs text-muted">{item.subtitle} · TradingView · 初期表示 1Y</p></div>
      <button type="button" onClick={onClose} aria-label="詳細グラフを閉じる" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised text-muted hover:text-ink"><X className="h-5 w-5" /></button>
    </div>
    <TradingViewWidget item={item} />
    <p className="mt-2 text-[11px] leading-relaxed text-muted">価格・遅延・表示期間は提供元の仕様によります。金はCMC MarketsのGOLDで、既存の金・銀鉱山株指数とは異なります。</p>
  </dialog>;
}
