'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3, ChevronUp } from 'lucide-react';
import type { FredSeriesData } from '@/lib/fred';
import type { MarketItem } from '@/lib/marketCatalog';
import { MARKET_ITEMS } from '@/lib/marketCatalog';
import { isValidHistory } from '@/lib/chartHistory';
import dynamic from 'next/dynamic';

const MarketSheet = dynamic(() => import('./MarketSheet'), { ssr: false });
const ChartModal = dynamic(() => import('./ChartModal').then(module => module.ChartModal), { ssr: false });

export interface Snapshot { data: Record<string, FredSeriesData>; updatedAt: string }
export type Detail = { item: MarketItem; series: FredSeriesData };

export function MarketDrawer() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [retry, setRetry] = useState(0);
  const [detail, setDetail] = useState<Detail | null>(null);
  const lastFetched = useRef(0);
  const fetchedRetry = useRef(0);

  useEffect(() => {
    if (!open) return;
    const forceRefresh = retry !== fetchedRetry.current;
    fetchedRetry.current = retry;
    if (!forceRefresh && Date.now() - lastFetched.current < 300_000) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    fetch('/api/markets', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Unavailable');
        const result = await response.json();
        if (result.success !== true || !result.data || typeof result.updatedAt !== 'string') throw new Error('Invalid snapshot');
        for (const item of MARKET_ITEMS) if (!isValidHistory(result.data[item.id], item.id)) throw new Error('Incomplete snapshot');
        if (active) { setSnapshot({ data: result.data, updatedAt: result.updatedAt }); setStatus('ready'); lastFetched.current = Date.now(); }
      })
      .catch(() => { if (active) setStatus('error'); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [open, retry]);

  const start = () => { setStatus(Date.now() - lastFetched.current >= 300_000 || !snapshot ? 'loading' : 'ready'); setOpen(true); };
  const refresh = () => { setStatus('loading'); setRetry(value => value + 1); };

  return (
    <>
      <button type="button" onClick={start} aria-label="マーケット一覧を開く" aria-haspopup="dialog" aria-expanded={open}
        className="fixed bottom-6 left-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-divider bg-surface px-4 text-sm font-semibold text-accent shadow-lg hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:left-8">
        <BarChart3 aria-hidden="true" className="h-4 w-4" />マーケット<ChevronUp aria-hidden="true" className="h-4 w-4" />
      </button>
      {open && <MarketSheet snapshot={snapshot} status={status} onRefresh={refresh} onClose={() => setOpen(false)}
        onDetail={value => { setOpen(false); setDetail(value); }} />}
      {detail && <ChartModal isOpen seriesId={detail.item.id} title={`${detail.item.title}（${detail.item.unit}）`}
        data={detail.series.observations} color="#3b82f6" onClose={() => { setDetail(null); start(); }} />}
    </>
  );
}

