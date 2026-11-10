export const MARKET_ITEMS = [
  { id: 'DEXJPUS', title: 'ドル円', unit: '円 / 米ドル', source: 'FRED＋為替補完' },
  { id: 'DEXUSEU', title: 'ユーロドル', unit: '米ドル / ユーロ', source: 'FRED＋為替補完' },
  { id: 'SP500', title: 'S&P 500', unit: '指数', source: 'FRED' },
  { id: 'NASDAQCOM', title: 'NASDAQ総合', unit: '指数', source: 'FRED' },
  { id: 'DJIA', title: 'NYダウ', unit: '指数', source: 'FRED' },
  { id: 'NIKKEI225', title: '日経平均', unit: '円', source: 'FRED' },
  { id: 'CBBTCUSD', title: 'ビットコイン', unit: '米ドル / BTC', source: 'FRED' },
  { id: 'CBETHUSD', title: 'イーサリアム', unit: '米ドル / ETH', source: 'FRED' },
  { id: 'NASDAQXAU', title: '金・銀鉱山株指数', unit: 'PHLX XAU指数', source: 'FRED' },
  { id: 'DCOILWTICO', title: 'WTI原油', unit: '米ドル / バレル', source: 'FRED' },
  { id: 'DHHNGSP', title: '天然ガス', unit: '米ドル / MMBtu', source: 'FRED' },
  { id: 'VIXCLS', title: 'VIX', unit: '指数', source: 'FRED' },
] as const;

export const MARKET_IDS = new Set<string>(MARKET_ITEMS.map(item => item.id));
export type MarketItem = typeof MARKET_ITEMS[number];
