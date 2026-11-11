'use client';

import { useEffect, useRef } from 'react';
import { Check, Star, X } from 'lucide-react';
import type { WatchMarket } from '@/lib/marketWatchlist';

type Props = {
  items: readonly WatchMarket[];
  selected: string;
  onlyFavorites: boolean;
  favoriteCount: number;
  onToggleFavorites: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function MarketPicker({ items, selected, onlyFavorites, favoriteCount, onToggleFavorites, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[aria-pressed="true"][data-market-choice]')?.scrollIntoView({ block: 'nearest' });
    return () => { dialog.close(); if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="market-picker-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="m-0 mt-auto max-h-[80dvh] w-full max-w-none flex-col rounded-t-3xl border border-divider bg-surface p-4 text-body shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm open:flex sm:m-auto sm:max-w-2xl sm:rounded-2xl sm:p-5">
    <div className="flex shrink-0 items-center justify-between gap-3"><h2 id="market-picker-title" className="text-lg font-bold">銘柄一覧</h2><button type="button" aria-label="銘柄一覧を閉じる" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-raised"><X className="h-5 w-5" /></button></div>
    <div className="mb-3 flex shrink-0 items-center justify-between gap-3"><p className="text-xs text-muted">タップして直接選択</p><button type="button" aria-pressed={onlyFavorites} onClick={onToggleFavorites} className={`inline-flex min-h-9 items-center gap-1 rounded-lg border px-2 text-xs ${onlyFavorites ? 'border-blue-600 bg-blue-600 text-white' : 'border-divider text-muted'}`}><Star className="h-3.5 w-3.5" />お気に入り {favoriteCount}</button></div>
    <div aria-label="マーケット銘柄選択" className="grid min-h-0 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
      {items.map(market => <button key={market.id} type="button" data-market-choice aria-pressed={market.id === selected} onClick={() => onSelect(market.id)} className={`flex min-h-12 items-center justify-between gap-1 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${market.id === selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-divider bg-canvas hover:border-emphasis'}`}><span>{market.title}</span>{market.id === selected && <Check className="h-4 w-4 shrink-0" />}</button>)}
    </div>
    {!items.length && <div className="py-6 text-center text-sm text-muted"><p>表示対象のお気に入りはありません。</p><p className="mt-1 text-xs">既存の登録情報は保持されています。</p><button type="button" onClick={onToggleFavorites} className="mt-3 min-h-10 text-accent">すべての銘柄を表示</button></div>}
  </dialog>;
}
