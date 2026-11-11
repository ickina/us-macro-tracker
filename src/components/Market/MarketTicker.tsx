'use client';
import { useEffect, useRef, useState } from 'react';
import { PROTOTYPE_MARKETS } from '@/lib/marketPrototype';

export function MarketTicker() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const container = host.current!;
    const mount = () => {
      container.replaceChildren();
      const content = document.createElement('div');
      content.className = 'tradingview-widget-container__widget';
      container.append(content);
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.async = true;
      script.textContent = JSON.stringify({ symbols: PROTOTYPE_MARKETS.filter(item => item.tickerSymbol).map(item => ({ proName: item.tickerSymbol, title: item.title })), colorTheme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', isTransparent: false, showSymbolLogo: false, displayMode: 'regular', locale: 'ja' });
      script.onerror = () => setFailed(true);
      container.append(script);
    };
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { observer.disconnect(); container.replaceChildren(); };
  }, []);
  return <section aria-label="TradingViewのマーケット価格帯" className="border-y border-divider bg-surface">
    <div ref={host} className="tradingview-widget-container min-h-[46px]" />
    {failed && <p role="status" className="px-4 py-2 text-xs text-negative">価格帯を読み込めませんでした。下の銘柄選択は利用できます。</p>}
    <div className="flex justify-between gap-2 px-4 py-1 text-[10px] text-muted sm:px-6"><span>騰落は帯内の基準に従います · 遅延あり</span><a href="https://www.tradingview.com/markets/" target="_blank" rel="noopener noreferrer nofollow" className="shrink-0 text-accent">by TradingView ↗</a></div>
  </section>;
}
