'use client';

import { useEffect, useRef, useState } from 'react';
type WidgetMarket = { id: string; title: string; subtitle: string };
type Props = { item: WidgetMarket; compact?: boolean; fill?: boolean };

export function TradingViewWidget(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return <WidgetInstance key={`${props.item.id}-${attempt}`} {...props} onRetry={() => setAttempt(value => value + 1)} />;
}

function WidgetInstance({ item, compact = false, fill = false, onRetry }: Props & { onRetry: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    const root = document.documentElement;
    const container = host.current;
    if (!container) return;
    let disposeMount = () => {};
    const mount = () => {
      disposeMount();
      container.replaceChildren();
      // Isolate each mount: a late script can only populate its detached old wrapper.
      const wrapper = document.createElement('div');
      wrapper.className = 'tradingview-widget-container';
      wrapper.style.height = '100%';
      wrapper.style.width = '100%';
      const widget = document.createElement('div');
      widget.className = 'tradingview-widget-container__widget';
      widget.style.height = '100%';
      widget.style.width = '100%';
      wrapper.append(widget);
      container.append(wrapper);
      let active = true;
      let iframe: HTMLIFrameElement | null = null;
      const timeout = window.setTimeout(() => { if (active) setStatus('error'); }, 25000);
      const loaded = () => { if (active) { window.clearTimeout(timeout); setStatus('ready'); } };
      const failed = () => { if (active) { window.clearTimeout(timeout); setStatus('error'); } };
      const frameObserver = new MutationObserver(() => {
        if (iframe) return;
        iframe = wrapper.querySelector('iframe');
        if (iframe) { iframe.addEventListener('load', loaded); iframe.addEventListener('error', failed); }
      });
      frameObserver.observe(wrapper, { childList: true, subtree: true });
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
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '12', headerFontSize: 'medium',
        valuesTracking: '1', changeMode: 'price-and-percent',
        noTimeScale: compact, hideDateRanges: compact, hideMarketStatus: false, hideSymbolLogo: false,
      });
      script.onerror = failed;
      wrapper.append(script);
      disposeMount = () => {
        active = false;
        window.clearTimeout(timeout);
        frameObserver.disconnect();
        iframe?.removeEventListener('load', loaded);
        iframe?.removeEventListener('error', failed);
        script.onerror = null;
        wrapper.remove();
      };
    };
    mount();
    const themeObserver = new MutationObserver(() => { setStatus('loading'); mount(); });
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { themeObserver.disconnect(); disposeMount(); container.replaceChildren(); };
  }, [item.id, compact]);
  return <>
    <div aria-busy={status === 'loading'} data-tv-chart className={`w-full ${fill ? 'min-h-[280px] flex-1' : compact ? 'h-[220px]' : 'h-[min(52dvh,480px)] min-h-[280px]'}`}>
      <div ref={host} className={status === 'error' ? 'hidden' : 'h-full w-full'} />
      {status === 'loading' && <span role="status" className="sr-only">グラフを読み込み中…</span>}
      {status === 'error' && <div role="alert" className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-3 text-center text-sm text-muted"><p>グラフを読み込めませんでした。</p><button type="button" onClick={onRetry} className="min-h-10 rounded-lg border border-divider px-3 text-accent">再試行</button><p className="text-xs">左右ボタンや銘柄一覧から、別の銘柄にも移動できます。</p></div>}
    </div>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3">
      <button type="button" onClick={onRetry} className="min-h-8 text-xs text-accent">グラフを再読み込み</button>
      <div className="tradingview-widget-copyright text-right text-[11px] text-muted">
        <a href={`https://www.tradingview.com/symbols/${item.id.replace(':', '-')}/`} target="_blank" rel="noopener noreferrer nofollow" className="text-accent hover:underline">{item.title}</a><span> by TradingView</span>
      </div>
    </div>
  </>;
}
