# TradingViewの帯・詳細とUI修正の分離調査

2026-11-11。調査・ローカル検証のみ。追加公開はしない。保存値の帯は未採用。

## 独立させた変更

- 公開基点：75a73fd（公開UI本体はfb476e7）。公開mainは変更していない。
- 保存値の帯の候補：ローカルの `trial/market-fit-saved-band` / `e50b762` に保全。採用や公開をしたものではない。
- UI修正：`trial/market-ui-only`。保存値の帯のコンポーネント・専用アニメーション・snapshotに合わせた履歴の日付制限を含めない。
- 元のMarketTickerと銘柄設定をそのまま残し、グラフに残りの高さを割り当てる変更、補助情報の折り畳み、全3ページでスケジュールと本文領域を分ける変更だけを切り離した。
- 帯の方式・取得元を変更する実装ではなく、現在の価格差を解決した版でもない。将来どの帯を使うかに依存しないUI修正。
- 1440×720、390×844、320×640の両テーマで初期グラフの描画領域が詳細枠内に収まることを確認。ダッシュボード・ニュースではスクロール後の非重複、既存詳細・スケジュール開閉と背面スクロール停止、41項目・ニュース検索を確認。本体ビルド・変更コンポーネントESLint成功。
- 取得スクリプト、API、保存データ、長期履歴ファイルは変更していない。

## 方法と判定基準

公式資料と、独立した検証用ページでの公式ウィジェット実表示を照合した。表示テキスト・エラーメッセージ・ステータスのtitle・iframeに渡った設定・スクリーンショットを確認。
Ticker TapeとSymbol Overviewの双方で同じ完全シンボルを指定し、価格が表示されるものを「組合せ確認済み」とした。アプリへ価格を抜き出す実装は行っていない。
残り8銘柄ではTicker Tape、Symbol Overview、Advanced Chart、Mini Chartも試行。Mini Chartは有効な表示を確定できない場合、文字が空だから非対応と断定せず未確認とした。
各市場の全配信元・全形式を網羅したという意味ではない。採用未確定のものをCFD、ETF、先物で代用していない。

## 当初の6銘柄

| 銘柄 | 帯と詳細へ渡した同じシンボル | 確認時の両ウィジェットの遅延表示 | 詳細の初期1Y |
| --- | --- | --- | --- |
| ドル円 | FX:USDJPY | Real-time | 確認済み |
| ユーロドル | FX:EURUSD | Real-time | 確認済み |
| BTC | COINBASE:BTCUSD | Real-time | 確認済み |
| ETH | COINBASE:ETHUSD | Real-time | 確認済み |
| NVDA | NASDAQ:NVDA | Quotes are delayed by 15 min | 確認済み |
| 金 | CMCMARKETS:GOLD | Real-time | 確認済み |

6銘柄とも、実際にiframeへ渡ったTicker TapeのproNameとSymbol Overviewのsymbolsが上記シンボルで一致することを確認。
Symbol Overviewでは `|12M` と `12m|1D` を指定し、初期表示の「Past year」を確認。全6銘柄で1Y→1D→1Yを操作し、1Dでは「1 day」、1Yに戻すと「Past year」になることを確認した。
帯の騰落は日次の変化。詳細の騰落は選択期間の変化。NVDAの確認例では帯/1Dの−9.78・−5.47%に対し、1Yは−30.16・−15.15%で、同じ比較値ではない。
金はCMC MarketsのGold - Cash。別の金シンボルへ代用していない。
同一シンボルでも別々のiframeが非同期に更新されるため、瞬間ごとの表示値の完全一致や更新時刻の同期までは保証しない。実試験でも為替の最終桁等にタイミング差が見られた。

## 残り8銘柄の結果

| 銘柄 | 確認できた同一系列の帯＋詳細 | 時間の性質／未確認事項 |
| --- | --- | --- |
| 日経平均 | FRED:NIKKEI225、Ticker Tape＋Symbol Overview（1Y） | 日次公表系列。場中のリアルタイム指数ではない |
| VIX | FRED:VIXCLS、Ticker Tape＋Symbol Overview（1Y） | 日次公表系列。TVC:VIXの直接配信は表示制限 |
| WTI原油 | FRED:DCOILWTICO、Ticker Tape＋Symbol Overview（1Y）、Advanced Chartも表示 | Cushingの現物価格。日次。先物・CFDではない |
| 天然ガス | FRED:DHHNGSP、Ticker Tape＋Symbol Overview（1Y）、Advanced Chartも表示 | Henry Hub現物価格。日次。先物・CFDではない |
| S&P 500 | 組合せ未確認 | SP:SPXは帯・Overview・Advancedで表示制限。FRED:SP500も今回はInvalid symbol |
| NASDAQ総合 | 組合せ未確認 | NASDAQ:IXICは表示制限。FRED:NASDAQCOMも今回はInvalid symbol |
| NYダウ | 組合せ未確認 | TVC:DJIは表示制限。FRED:DJIAも今回はInvalid symbol |
| 金・銀鉱山株指数 | 組合せ未確認 | NASDAQ:XAUは表示制限。FRED:NASDAQXAUも今回はInvalid symbol |

補足：TVC:NI225は表示制限だったが、同じ日経平均の日次系列FRED:NIKKEI225では双方の表示を確認できた。CBOE:VIXを読み込めなかった以前の結果だけでVIX全体を非対応とせず、TVC:VIXとFRED:VIXCLSを別途確認した。
FREDのWTI/天然ガスは公式ページに元データがEIA・頻度Dailyと明記される。UEIAという画面上の提供元名をシンボルprefixとして推測した別指定は無効だったため採用しない。
4つのFRED日次系列ではウィジェットの汎用titleにReal-timeと出ることがあるが、元の公表頻度が日次である事実は変わらない。分単位の遅延数は確認していない。リアルタイム市場価格として案内しない。
公式Indices OverviewデモにはFRED:SP500も記載されるが、今回の実表示は無効。公式コードの掲載だけを成功の根拠にしない。

## 推奨する構成（未実装・未承認）

**同じ商品の帯・詳細を確認できた10銘柄はTradingViewへそろえ、未確認の4銘柄は既存グラフを残す。**

- 相場を見る6銘柄：為替2、BTC/ETH、NVDA、金。両方に同一シンボルを使い、NVDAの15分遅延と他5銘柄の確認時Realtimeを区別する。
- 日次公表の4銘柄：日経平均、VIX、WTI、天然ガス。両方に同一FREDシンボルを使い、「日次」と分かる表示にする。この4つをTVへ変えても価格の新しさは改善しない。
- 未確認の4銘柄：S&P500、NASDAQ総合、NYダウ、金銀鉱山株指数。既存保存グラフで表示し、価格帯へ別商品を紛れ込ませない。
- 14銘柄を選択できる入口は維持。既存12銘柄の保存グラフと長期期間は、ダッシュボードに加えて「保存履歴」の入口等から残す。公式グラフの期間選択肢が既存の3Y/10Y等と一致するとは約束しない。
- 帯の「日次騰落」と詳細の「選択期間騰落（初期1Y）」を近くで明示する。
- 保存値の自作帯は採用しない。この提案は今のアプリのシンボル一覧・取得元へ実装していない。

## 公式資料

- 配信・遅延・表示制限のFAQ：https://www.tradingview.com/widget-docs/faq/data/
- 北米のウィジェット配信：https://www.tradingview.com/widget-docs/markets/north-america/
- 為替・暗号資産の配信：https://www.tradingview.com/widget-docs/markets/worldwide/
- 日経平均の日次系列：https://www.tradingview.com/symbols/FRED-NIKKEI225/
- VIXの日次系列：https://www.tradingview.com/symbols/FRED-VIXCLS/
- WTIの同一現物系列：https://www.tradingview.com/symbols/FRED-DCOILWTICO/
- 天然ガスの同一現物系列：https://www.tradingview.com/symbols/FRED-DHHNGSP/
- 公式デモと実表示の差：https://www.tradingview.com/widget-docs/widgets/charts/symbol-overview/demos/indices-overview/

アカウントの有料化でウィジェットの制限・リアルタイム配信が解決するとは公式FAQも述べていない。実表示の確認と、将来の継続提供の保証は別。
