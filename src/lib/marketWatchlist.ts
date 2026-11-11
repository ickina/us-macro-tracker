// Approved 2026-11-12: order is shared by the selector and previous/next gestures.
// CFD ids intentionally differ from the former FRED series; favorites are not migrated to another product.
export type WatchMarket = {
  id: string;
  title: string;
  symbol: string;
  status: string;
  description: string;
  historyId?: string;
};
export const MARKET_WATCHLIST: readonly WatchMarket[] = [
  { id: 'DEXJPUS', title: 'ドル円', symbol: 'FX:USDJPY', status: '為替・随時配信', description: 'FXのUSD/JPY配信。ダッシュボード・保存履歴とは取得元や更新時点が異なり、価格が一致しない場合があります。', historyId: 'DEXJPUS' },
  { id: 'DEXUSEU', title: 'ユーロドル', symbol: 'FX:EURUSD', status: '為替・随時配信', description: 'FXのEUR/USD配信。ダッシュボード・保存履歴とは取得元や更新時点が異なり、価格が一致しない場合があります。', historyId: 'DEXUSEU' },
  { id: 'SPX500_CFD', title: 'S&P500 CFD', symbol: 'FOREXCOM:SPX500', status: 'FOREX.com・CFD・随時配信', description: 'S&P500を参照するCFD価格です。既存FREDのS&P500指数そのものの配信へ置換したものではありません。' },
  { id: 'NAS100_CFD', title: 'NASDAQ100 CFD', symbol: 'FOREXCOM:NAS100', status: 'FOREX.com・CFD・随時配信', description: 'NASDAQ100を参照するCFDです。従来のNASDAQ総合とは指数の構成銘柄も異なります。' },
  { id: 'NIKKEI225', title: '日経平均', symbol: 'INDEX:NKY', status: 'INDEX・終値データ（日次）', description: 'Japan 225 IndexのEOD配信です。場中のリアルタイム配信ではありません。更新時刻・元の配信社は未確認です。' },
  { id: 'NVDA', title: 'NVIDIA', symbol: 'NASDAQ:NVDA', status: 'NASDAQ・15分遅延', description: 'NVIDIA株。遅延・市場の開閉状態は公式表示にも従います。' },
  { id: 'AAPL', title: 'Apple', symbol: 'NASDAQ:AAPL', status: 'NASDAQ・15分遅延', description: 'Apple株。遅延・市場の開閉状態は公式表示にも従います。' },
  { id: 'TSLA', title: 'Tesla', symbol: 'NASDAQ:TSLA', status: 'NASDAQ・15分遅延', description: 'Tesla株。遅延・市場の開閉状態は公式表示にも従います。' },
  { id: 'GOLD', title: '金', symbol: 'CMCMARKETS:GOLD', status: 'CMC Markets・Gold - Cash・随時配信', description: 'CMC MarketsのGold - Cash配信。既存の金銀鉱山株指数とは別の商品です。' },
  { id: 'SILVER', title: '銀 CFD', symbol: 'TVC:SILVER', status: 'TVC・銀CFD・随時配信', description: 'TradingView算出の銀CFD（米ドル／オンス）。現物取引価格そのものの直接配信ではありません。' },
  { id: 'USOIL_CFD', title: 'WTI原油 CFD', symbol: 'TVC:USOIL', status: 'TVC・原油CFD・随時配信', description: 'TradingView算出のWTI原油CFD。既存FREDのCushing現物価格や原油先物とは別の商品です。' },
  { id: 'CBBTCUSD', title: 'BTC', symbol: 'COINBASE:BTCUSD', status: 'Coinbase・USD建て・随時配信', description: 'BTC/USD。ダッシュボード・保存履歴のFRED日次保存値とは更新時点が異なり、価格が一致しない場合があります。', historyId: 'CBBTCUSD' },
  { id: 'CBETHUSD', title: 'ETH', symbol: 'COINBASE:ETHUSD', status: 'Coinbase・USD建て・随時配信', description: 'ETH/USD。ダッシュボード・保存履歴のFRED日次保存値とは更新時点が異なり、価格が一致しない場合があります。', historyId: 'CBETHUSD' },
  { id: 'SOLUSDT', title: 'SOL／USDT', symbol: 'BINANCE:SOLUSDT', status: 'Binance・USDT建て・随時配信', description: 'SOLをTether（USDT）で表示します。USD建てではありません。' },
  { id: 'VIXCLS', title: 'VIX', symbol: 'FRED:VIXCLS', status: 'FRED・日次データ', description: 'Cboe VIXの日次系列です。公式内部に汎用のリアルタイム表示が出る場合でも、日次データがリアルタイム化したものではありません。' },
];
