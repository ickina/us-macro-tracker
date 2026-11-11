'use client';

import { useEffect, useRef, useState } from 'react';
type WidgetMarket = { id: string; title: string; subtitle: string };

export function TradingViewWidget({ item, compact = false, fill = false }: { item: WidgetMarket; compact?: boolean; fill?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const container = host.current;
    const mount = () => {
      if (!container) return;
      container.replaceChildren();
      const widget = document.createElement('div');
      widget.className = 'tradingview-widget-container__widget';
      widget.style.height = '100%';
      widget.style.width = '100%';
      container.append(widget);
      const dark = root.dataset.theme === 'dark';
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
      script.async = true;
      script.type = 'text/javascript';
      script.textContent = JSON.stringify({
        symbols: [[`${item.id}|12M`]],
        dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
        chartType: 'area', lineWidth: 2, lineType: 0,
        colorTheme: dark ? 'dark' : 'light', backgroundColor: dark ? '#111827' : '#ffffff',
        fontColor: dark ? '#9ca3af' : '#526176', widgetFontColor: dark ? '#f3f4f6' : '#15243b',
        gridLineColor: dark ? 'rgba(55,65,81,0.4)' : 'rgba(213,222,233,0.4)',
        upColor: '#22ab94', downColor: '#f7525f',
        locale: 'ja', autosize: true, width: '100%', height: '100%',
        isTransparent: false, chartOnly: false, scalePosition: 'right', scaleMode: 'Normal',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '10', headerFontSize: 'medium',
        valuesTracking: '1', changeMode: 'price-and-percent',
        noTimeScale: compact, hideDateRanges: compact, hideMarketStatus: false, hideSymbolLogo: false,
      });
      script.onerror = () => setFailed(true);
      container.append(script);
    };
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { observer.disconnect(); container?.replaceChildren(); };
  }, [item.id, compact]);
  return <>
    <div className={`w-full ${fill ? 'min-h-[280px] flex-1' : compact ? 'h-[220px]' : 'h-[min(52dvh,480px)] min-h-[280px]'}`}><div ref={host} className="tradingview-widget-container h-full w-full" /></div>
    {failed && <p role="status" className="text-xs text-negative">グラフを読み込めませんでした。開き直すかTradingViewでご確認ください。</p>}
    <div className="tradingview-widget-copyright shrink-0 text-right text-[11px] text-muted">
      <a href={`https://www.tradingview.com/symbols/${item.id.replace(':', '-')}/`} target="_blank" rel="noopener noreferrer nofollow" className="text-accent hover:underline">{item.title}</a><span> by TradingView</span>
    </div>
  </>;
}
