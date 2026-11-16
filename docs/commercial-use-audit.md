# 商用利用条件の棚卸し

調査日: 2026-11-16

この文書は、現在のコードと各提供元の公開条件を照合した開発上の確認記録です。法律相談ではありません。実際に課金・広告・法人提供を始める前には、条件の再確認と、必要に応じて提供元または専門家への確認を行います。

## 先に結論

現在のまま無料の個人プロジェクトとして公開を続けることと、有料アプリ・広告付きサービスとして販売することは分けて考える。

- **現状の無料公開**: 直ちに全機能を止める段階ではない。ただし、FREDと為替APIの表示義務、利用規約・プライバシー表示は整える。
- **一般向け無料ベータ**: CNBC本文の翻訳・要約掲載を整理し、出典表示と免責を整えてから行う。
- **課金・広告・法人提供**: 現在のままでは進めない。TradingViewの商用許可、第三者権利付きFRED系列、CNBC、Vercelプランが未解決。

ここでいうVercelの **Pro** は、GPTの推論モードやクレジットとは無関係な公開サーバーの契約名。今の個人・非商用公開では変更不要で、今回は契約変更も支払いも行わない。将来収益化するときに、Vercel Proだけでなく商用利用できる別の安価な公開先も比較する。

## 判定の意味

- **利用可**: 現在確認できた条件では商用利用可能。表示義務などは守る。
- **条件付き**: 使い方や系列ごとの権利確認、表示追加が必要。
- **販売前の要対応**: 許可または差し替えが済むまで、有料・広告付き提供には入れない。
- **要確認**: 契約プランや素材の由来など、コードだけでは判断できない。

## 外部サービスとデータ

| 対象 | 現在の使い方 | 判定 | 確認できた条件と不足 | 推奨対応 |
|---|---|---|---|---|
| FRED | 41系列を `fredgraph.csv` から取得し、保存・グラフ表示 | 条件付き | FREDは第三者所有系列の権利を上書きしない。FRED API規約には所定の非推奨表示、規約リンク、利用者による規約同意がある。現状はAPIキーを使う公式APIではなくグラフCSVのため、同規約がどこまで直接適用されるかも確認が必要 | FREDの出典・非推奨表示を追加。公式APIへの移行要否を確認。第三者系列を個別処理する |
| FRED内の第三者系列 | 株価指数、暗号資産、ハイイールド、センチメント等 | 販売前の要対応 | 下記「41系列の権利区分」を参照。事前承認・再配布許可が必要な系列を保存・再表示している | 許可取得、商用ライセンス付き別データへの置換、または商用版から除外のいずれかを系列ごとに決める |
| Federal Reserve Board RSS | 金融政策ニュースを取得し、定型の日本語案内と公式リンクを表示 | 条件付き（低リスク） | 公式の連邦機関情報。第三者素材には別権利があり、Boardによる推奨を示してはいけない。現在確認したサイトポリシーにはRSS再配布の個別許諾までは明記されていない | 公式リンク・出典を維持し、ロゴを無断使用せず、短い事実案内に限定。販売前にRSS利用条件を問い合わせると安全 |
| CNBC RSS | 見出し・説明を取得し、日本語へ翻訳して記事カードに保存・表示 | **販売前の要対応** | NBCUniversal規約はサービスとコンテンツを原則として個人利用に限定し、書面同意なしの利用・活用を認めていない。翻訳・要約して自サービス内へ継続掲載する商用許可は確認できない | 商用版では停止を第一候補とする。残す場合は書面許可または商用ニュースライセンスを取得。単なる出典リンクだけでも条件を再確認する |
| Googleの翻訳エンドポイント | `translate.googleapis.com/translate_a/single?client=gtx` を認証なしで利用 | **販売前の要対応** | 現在の呼び出し先は公開されたCloud Translation APIの正規実装ではない。Google API規約は文書化された方法でのアクセスを要求する | CNBC処理を止めれば同時に除去可能。翻訳を残す場合は、翻訳する権利のある文章だけを公式Cloud Translation API等で処理する |
| ExchangeRate-API / ER-API | USD基準の為替を日次取得し、ドル円・ユーロドルを補完。クライアントからも取得 | 利用可（表示追加が必要） | Open APIは個人・商用利用可、キャッシュ可、再配布不可、1日1回更新、レート制限あり。使用ページに指定リンクの表示が必須 | 為替表示ページに `Rates By Exchange Rate API` のリンクを追加。クライアントの重複取得を整理し、原則サーバー側で日次キャッシュする |
| TradingView Symbol Overview | マーケット15銘柄を公式ウィジェットで表示 | **販売前の要対応** | 現実装は表示専用で、価格抽出をせず、公式帰属表示を維持している点は適切。一方、一般規約は別契約で明示されない商用利用を認めておらず、データの有償再配布も禁止している | 無料個人公開の範囲を越える前に、TradingViewへ「有料Web/PWA・iOS/Android内の公式ウィジェット利用」を書面確認。許可が得られなければ商用ライセンス付きデータと自前チャートへ置換する |
| Vercel | 公開Web/PWAのホスティング | 契約プラン要確認 | Vercel規約はHobbyを個人または非商用利用に限定。Proは業務向け。リポジトリから現在の契約プランは確定できない | 現在のプランを管理画面で確認。課金・広告・事業利用開始前にHobbyならProへ移行する |
| Apple App Store | 将来のiOSアプリ配布候補 | 配布時に費用 | ブラウザ版・PWAには不要。App Store配布とTestFlight等にはApple Developer Programの年99米ドル会費が必要。無料アプリで課金がなければ販売手数料は発生しない | 需要確認中はPWAを継続し、ストア公開を決めた段階でだけ登録する。課金する場合はSmall Business Programの15%条件を確認する |

## FRED 41系列の権利区分

FREDの系列ページに表示された権利区分と注記を基準に整理した。数値がFREDで閲覧できることは、その数値を別の有料アプリで保存・再表示できる許可を意味しない。

### 事前承認・再配布許可を先に確認する系列

| 系列 | 提供元 | 確認内容 |
|---|---|---|
| `BAMLH0A0HYM2` | ICE Data Indices | 複製には事前の書面許可が必要との注記。FRED分類も Pre-Approval Required |
| `SP500` | S&P Dow Jones Indices | 複製許可の取得先が案内され、Pre-Approval Required |
| `DJIA` | S&P Dow Jones Indices | 複製には事前の書面許可が必要、Pre-Approval Required |
| `NASDAQCOM` | Nasdaq | 著作権表示、Pre-Approval Required |
| `NASDAQXAU` | Nasdaq | 著作権表示、Pre-Approval Required |
| `NIKKEI225` | Nikkei | 第三者へのデータまたはデータ入り資料の再配布はNikkeiへの許可申請が必要 |
| `CBBTCUSD` | Coinbase | 事前の書面許可なしの複製を禁止する注記 |
| `CBETHUSD` | Coinbase | 事前の書面許可なしの複製を禁止する注記 |

### 引用条件・用途を追加確認する系列

| 系列 | 提供元 | 確認内容 |
|---|---|---|
| `VIXCLS` | Cboe | 著作権表示と推奨引用あり。FRED分類は Citation Required。商用アプリへの保存再表示範囲は別途確認 |
| `UMCSENT` | University of Michigan | 1か月遅延、指定の引用文と著作権表示あり。商用アプリへの保存再表示範囲は別途確認 |

### 公的機関・FRED算出系列（出典表示を整えて継続候補）

`DEXJPUS`, `DTWEXBGS`, `DEXUSEU`, `FEDFUNDS`, `DGS10`, `DGS2`, `T10Y2Y`, `T10Y3M`, `DFII10`, `T10YIE`, `CPIAUCSL`, `CPILFESL`, `PCEPI`, `PCEPILFE`, `WPSFD49207`, `UNRATE`, `PAYEMS`, `CES0500000003`, `CIVPART`, `U6RATE`, `ICSA`, `CCSA`, `JTSJOL`, `DCOILWTICO`, `DHHNGSP`, `GDP`, `RSAFS`, `INDPRO`, `HOUST`, `WALCL`, `M2SL`

これらも「無条件」とは断定せず、系列ページの推奨引用と元機関の条件を維持する。特にFRED側の所定表示と、商用開始時点の最新条件を再確認する。

## アプリ本体・ライブラリ・素材

| 対象 | 判定 | 内容 |
|---|---|---|
| Next.js / React / Capacitor / Recharts / Tailwind等 | 利用可 | 直接依存はMIT・ISC・Apache-2.0。商用利用可能。配布形態に応じてライセンス通知を同梱する |
| アプリ名 `ichi Macro` と自作UI | 利用可の見込み | リポジトリに第三者テンプレートの権利表示はない。商標登録の有無は別途検索が必要 |
| アプリアイコン・共有画像 | 要確認 | 現在は独自デザインに見えるが、元素材・生成手段の記録がリポジトリ内にない。販売前に「自作または商用利用可能」の証跡を残す |
| ローカル保存 | 低リスク | お気に入り、テーマ、既読状態等を端末のlocalStorageに保存。アカウントや氏名等の収集は現在確認できない |
| プライバシーポリシー・利用規約 | 土台を実装 | `/about` にデータ提供元、免責、端末内保存、外部通信、利用条件、連絡窓口を集約。正式な販売条件を決める段階で法的レビューと改訂が必要 |

## 公開・販売前に必要な表示

最低限、次をアプリ内から常時確認できるページへまとめる。

1. 運営者・問い合わせ先
2. 利用規約
3. プライバシーポリシー（外部通信、端末内保存、将来Analyticsを入れる場合の扱い）
4. 投資助言ではないこと、正確性・即時性を保証しないこと
5. データ提供元、更新頻度・遅延、各提供元による非推奨
6. FREDの所定表示とFRED API利用規約へのリンク（適用範囲を確認した上で掲載）
7. ExchangeRate-APIの指定帰属リンク
8. オープンソースライセンス通知

FRED API規約に記載された所定文は次のとおり。

> This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.

## アリアの推奨順序

### 第1段階: 無料公開を整える

1. 出典・免責・利用規約・プライバシーポリシーのページを用意する。
2. ExchangeRate-APIの指定リンクを追加する。
3. CNBCの見出し・記事説明の翻訳ニュースを、商用化を妨げない構成へ切り離す。最も安全なのはFRB等の公式情報中心へ戻すこと。
4. FREDの第三者系列に「権利確認待ち」フラグを付け、商用版候補から分離できるよう記録する。

### 第2段階: 小規模な一般公開テスト

個人・非商用の無料ベータとして、利用目的と免責を明示して反応を見る。ここでは決済・広告を入れない。

### 第3段階: 課金前の契約確認

1. TradingViewへ商用Web/PWA・ネイティブアプリ内利用を問い合わせる。
2. 残す第三者系列の許可または代替データ契約を決める。
3. Vercel Pro等の商用ホスティングへ移行する。
4. Apple/Googleの開発者契約、ストア用プライバシー回答、販売主体・税務・特商法表示を整える。

## 公式確認先

- FRED Legal: https://fred.stlouisfed.org/legal/
- FRED API Terms of Use: https://fred.stlouisfed.org/docs/api/terms_of_use.html
- 各FRED系列: `https://fred.stlouisfed.org/series/{SERIES_ID}`
- TradingView Terms of Use: https://www.tradingview.com/policies/
- TradingView Widget FAQ: https://www.tradingview.com/widget-docs/faq/general/
- Federal Reserve Board Website Policies: https://www.federalreserve.gov/website-linking-policies.htm
- NBCUniversal Terms of Service: https://www.nbcuniversal.com/terms
- Google APIs Terms of Service: https://developers.google.com/terms
- ExchangeRate-API Open Access Documentation: https://www.exchangerate-api.com/docs/free
- ExchangeRate-API Terms: https://www.exchangerate-api.com/terms
- Vercel Terms of Service: https://vercel.com/legal/terms
- Vercel Plans: https://vercel.com/docs/plans
- Apple Developer Program: https://developer.apple.com/programs/
- App Store Small Business Program: https://developer.apple.com/app-store/small-business-program/

