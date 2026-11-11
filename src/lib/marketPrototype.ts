import { MARKET_ITEMS } from './marketCatalog';

export type PrototypeMarket = {
  id: string; title: string; subtitle: string;
  symbol?: string; tickerSymbol?: string;
};
// Only confirmed exact products. No index CFDs, ETFs, or futures substitutions.
const tickerSymbols: Record<string, string> = {
  DEXJPUS: 'FX:USDJPY', DEXUSEU: 'FX:EURUSD',
  CBBTCUSD: 'COINBASE:BTCUSD', CBETHUSD: 'COINBASE:ETHUSD',
};
export const PROTOTYPE_MARKETS: PrototypeMarket[] = [
  ...MARKET_ITEMS.map(item => ({
    id: item.id, title: item.title, subtitle: `${item.source} · ${item.unit}`,
    tickerSymbol: tickerSymbols[item.id],
  })),
  { id: 'NVDA', title: 'NVIDIA', subtitle: 'NASDAQ · NVDA', symbol: 'NASDAQ:NVDA', tickerSymbol: 'NASDAQ:NVDA' },
  { id: 'GOLD', title: '金', subtitle: 'CMC Markets · GOLD', symbol: 'CMCMARKETS:GOLD', tickerSymbol: 'CMCMARKETS:GOLD' },
];
