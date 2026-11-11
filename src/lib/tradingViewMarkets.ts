// Isolated trial: remove these items to hide the TradingView additions.
export const TRADING_VIEW_MARKETS = [
  { id: 'NASDAQ:NVDA', title: 'NVIDIA', subtitle: 'NVDA · NASDAQ' },
  { id: 'CMCMARKETS:GOLD', title: '金', subtitle: 'GOLD · CMC Markets' },
] as const;
export type TradingViewMarket = typeof TRADING_VIEW_MARKETS[number];
