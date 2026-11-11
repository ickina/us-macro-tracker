# 指定15銘柄へのマーケット更新

2026-11-12 JST。最新の実装指示書に基づく。旧14銘柄構成・TradingView価格帯の維持は撤回済み。

## 確認した採用シンボルと順序

独立した検証ページで、下記15シンボル全てのSymbol Overview・価格表示・初期Past yearを実確認。指定文字列を別のaliasへ書き換えない。

| 順 | アプリ表示 | 完全シンボル | 確認時の性質・遅延 |
| --- | --- | --- | --- |
| 1 | ドル円 | FX:USDJPY | Real-time |
| 2 | ユーロドル | FX:EURUSD | Real-time |
| 3 | S&P500 CFD | FOREXCOM:SPX500 | FOREX.comのCFD、Real-time |
| 4 | NASDAQ100 CFD | FOREXCOM:NAS100 | FOREX.comのCFD、Real-time。NASDAQ総合ではない |
| 5 | 日経平均 | INDEX:NKY | End of Day。終値。元の配信社・更新時刻は未確認 |
| 6 | NVIDIA | NASDAQ:NVDA | 15分遅延 |
| 7 | Apple | NASDAQ:AAPL | 15分遅延 |
| 8 | Tesla | NASDAQ:TSLA | 15分遅延 |
| 9 | 金 | CMCMARKETS:GOLD | Gold - Cash、Real-time |
| 10 | 銀 CFD | TVC:SILVER | TVC算出のCFD、USD/オンス、Real-time |
| 11 | WTI原油 CFD | TVC:USOIL | TVC算出のCFD、Real-time。EIA現物ではない |
| 12 | BTC | COINBASE:BTCUSD | Coinbase、USD建て、Real-time |
| 13 | ETH | COINBASE:ETHUSD | Coinbase、USD建て、Real-time |
| 14 | SOL／USDT | BINANCE:SOLUSDT | Binance、USDT建て、Real-time |
| 15 | VIX | FRED:VIXCLS | FRED日次。汎用tooltipがReal-timeでも日次という性質は変わらない |

銀の商品種別の一次資料：https://www.tradingview.com/symbols/TVC-SILVER/ （CFDs on Silver）。
ステータスは確認時の実表示で、将来の継続提供や厳密な配信周期を保証するものではない。公式の銘柄・ロゴ・帰属表記・期間操作は残す。価格を抽出して独自グラフへ利用しない。

## 旧系列と新マーケットの関係

既存の取得・保存・ダッシュボードの41項目・カテゴリを削除/変更しない。

| 旧ダッシュボード系列 | 新マーケットの表示 | 関係と維持するもの |
| --- | --- | --- |
| DEXJPUS | FX:USDJPY | 為替配信への表示変更。保存履歴入口を維持。ダッシュボードのFRED＋補完とは時点・提供元が異なる |
| DEXUSEU | FX:EURUSD | 同上 |
| SP500 | FOREXCOM:SPX500 | 指数とCFDは別商品。旧指数はダッシュボードと履歴に維持 |
| NASDAQCOM | FOREXCOM:NAS100 | 総合指数とNASDAQ100 CFDは構成銘柄も異なる。旧総合は維持 |
| DJIA | 今回の15には含めない | ダッシュボード・取得・履歴・お気に入り保存情報は維持 |
| NIKKEI225 | INDEX:NKY | 日経225のEOD候補。取得系列自体は変更しない |
| CBBTCUSD | COINBASE:BTCUSD | 場中配信。FRED日次保存履歴入口を維持 |
| CBETHUSD | COINBASE:ETHUSD | 同上 |
| NASDAQXAU | 今回の15には含めない | 金・銀の価格とは別の鉱山株指数。旧系列はダッシュボードに維持 |
| DCOILWTICO | TVC:USOIL | Cushing現物とCFDは別商品。旧現物系列を維持 |
| DHHNGSP | 今回の15には含めない | Henry Hub現物はダッシュボード・履歴に維持 |
| VIXCLS | FRED:VIXCLS | 元の日次系列の公式表示。鮮度改善とは説明しない |
| 追加済みNVDA・金 | 同じ完全シンボル | 継続 |

Apple・Tesla・銀CFD・SOL/USDTをマーケットへ追加。FANG+・Microsoft・Amazon・Alphabet等は追加しない。お気に入りの保存キー/値を書き換えず、旧指数のお気に入りを新CFDへ引き継ぐ処理はしない。
WTI/GDP/FF金利の表示名の別件は `data-label-review.md` の記録を維持し、取得系列を無断変更しない。

## 操作と読み込み

- 既存TodayHighlightsをそのまま再利用。価格帯はマウントしない。予定の停止・再開・予定一覧からの既存スケジュールを維持。
- 共通15ボタンと、グラフ直上の銘柄名領域を左右スワイプ。左へ動かすと次、右へ動かすと前。端では停止。PCの左右ボタン・見出しにフォーカスして左右キーでも切替。
- iframeへ親から触れないことをSecurityErrorで確認。iframe内部のスワイプは銘柄切替に使わない。透明な覆いも付けない。縦タッチはpan-yでネイティブスクロールに任せる。
- 1個の選択中ウィジェットだけを読み込み、切替/テーマ変更/遷移で古いmount・リスナー・タイマーを破棄。遅れて戻る旧scriptは分離した旧wrapperにしか挿入できない。
- script/iframeの通信エラーと読み込みタイムアウトには再試行を表示。iframe内部の配信制限・価格エラーは親から判定できないため、常設の再読み込みと銘柄切替も用意。
- 保存データは4銘柄の「保存履歴」を開いた時だけ取得し、既存ChartModalと長期期間を使用。既存API・保存履歴ファイルを変更しない。
- 右下のスケジュール、48px＋安全領域の予約スペースは維持。短い画面は詳細枠内の縦スクロールを許可し、公式グラフを過度に縮めない。

## 確認と公開

ローカル確認・GitHub反映・公開URL確認は区別して完了報告する。PC1440×720、スマホ390×844と320×640、ライト/ダークで全15実表示・初期1Y・期間操作・選択順・スワイプ・注目帯・予定一覧・スケジュール非重複を検証済み。
別途、テーマ変更・連続切替・エラー再試行・縦タッチ/iframe操作の非干渉・画面遷移・お気に入り保存値不変・ダッシュボード41項目・ニュース検索・未選択ウィジェットがないことを検証済み。スマホはブラウザのviewport/タッチ再現であり、実機ではない。

## 今回だけ戻す方法

公開基点f06e630。この基点から本書を含む「feat(markets): add approved fifteen-symbol overview and swipe navigation」の1コミットにまとめる。戻す際は当該コミットをgit revertしてmainへpushする。既存データ更新や過去のUI変更までresetしない。
