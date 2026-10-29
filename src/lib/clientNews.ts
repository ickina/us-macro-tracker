import { MacroNewsItem } from '@/app/api/news/route';

// HTMLエンティティの安全なデコード
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8230;/g, '…')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '') // HTMLタグ除去
    .trim();
}

function stripPrefix(str: string): string {
  return str.replace(/^(【.*?】\s*)+/g, '').trim();
}

// FRED Blog記事の詳細な日本語化＆個別具体的要約マッピング
interface BlogMeta {
  title: string;
  summary: string;
  points: string[];
  category: MacroNewsItem['category'];
  isValid: boolean; // 個別翻訳・要約が存在するかどうか
}

function getFredBlogDetail(rawTitle: string, rawDesc: string): BlogMeta {
  const cleanTitle = stripPrefix(decodeHtmlEntities(rawTitle));
  const t = cleanTitle.toLowerCase();
  const cleanDesc = decodeHtmlEntities(rawDesc);

  // 1. 国内純生産 (NDP)
  if (t.includes('net domestic product') || t.includes('ndp')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】国内純生産（NDP）と資本減耗：真の富の蓄積を測る',
      summary: 'GDP（国内総生産）から設備の減価償却（資本減耗）を差し引いた「国内純生産（NDP）」の推移を分析。インフラ更新コストの増大が将来の実質成長力に与える影響を解説。',
      points: [
        '【NDPの重要性】設備の老朽化補修を除いた、真に経済が生み出した純粋な付加価値',
        '【減価償却の負担】高インフレ下での設備再投資コスト増大が企業の純利益を圧迫',
        '【成長の持続性】単なる名目GDPの膨張ではなく、実質的な設備更新力の維持が焦点'
      ],
      category: 'growth'
    };
  }

  // 2. 生成AIと労働生産性
  if (t.includes('generative ai') || t.includes('ai-driven') || t.includes('ai boom') || t.includes('artificial intelligence') || t.includes('save time')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】生成AIによる生産性向上の初期シグナル：情報通信セクター分析',
      summary: '生成AIの普及以降、情報通信・テックセクターにおいて過去平均を上回る急激な生産性向上が観測され始めたことを示す最新実証データ分析。',
      points: [
        '【AI生産性効果】情報セクターで顕著な労働生産性の急加速シグナルを確認',
        '【波及プロセス】ソフトウェア開発・データ処理から他産業の現場業務へ効果が拡大',
        '【マクロへの示唆】企業のコスト削減と潜在GDP成長率の押し上げ要因として期待'
      ],
      category: 'growth'
    };
  }

  // 3. FOMC SEP / 経済予測
  if (t.includes('summary of economic projections') || (t.includes('fomc') && t.includes('projection'))) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】FOMC経済予測（SEP）とドットチャートの定点観測',
      summary: 'セントルイス連銀エコノミストが、FOMC参加者による最新の経済見通し（実質GDP・失業率・PCEインフレ率）および将来の政策金利予測（ドットプロット）の変動要因を分析。',
      points: [
        '【経済見通し】実質GDP成長率や失業率、PCEインフレ率の将来見通しの最新改定',
        '【政策金利予測】ドットプロットが示す政策金利の想定着地点（ターミナルレート）',
        '【市場への示唆】金融市場が織り込む金利動向と連銀当局者スタンスのギャップ'
      ],
      category: 'policy'
    };
  }

  // 4. オプション価格 / カンザスシティ連銀スキュー指標
  if (t.includes('options prices') || t.includes('policy rate skew') || t.includes('financial risk')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】オプション価格から探る金融リスク：金利スキュー指標',
      summary: 'オプション市場の取引価格データを活用し、市場参加者が将来の政策金利の急激な上下リスク（テールリスク）をどのように警戒しているかを可視化したレポートです。',
      points: [
        '【リスク測定】オプション価格から金利の急激な変動リスク（テールリスク）を抽出',
        '【市場心理】政策金利の上振れ・下振れに対する市場参加者の警戒度の偏りを可視化',
        '【金融安定性】急激な市場ボラティリティ上昇や流動性悪化の兆候を早期に監視'
      ],
      category: 'market'
    };
  }

  // 5. マネーサプライ M2
  if (t.includes('measuring money') || t.includes('m2') || t.includes('money supply')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】マネーサプライM2の測定と通貨供給量の見方',
      summary: '米国の主要な通貨供給量指標である「M2（現金・普通預金・小口定期等）」の計測方法と、近年のマネー供給量の急激な変動が経済や物価に与えた影響を解説。',
      points: [
        '【M2の仕組み】現金・当座預金・普通預金・小口定期預金など流動性資産の総量',
        '【トレンド推移】コロナ禍でのマネー急増と、その後の量的引き締めによる正常化傾向',
        '【インフレ連動】通貨供給量の増減が物価水準や金融引き締め効果に与える影響'
      ],
      category: 'growth'
    };
  }

  // 6. 住宅・賃貸 vs 購入
  if (t.includes('good time to rent') || t.includes('housing') || t.includes('mortgage') || t.includes('rent')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】住宅購入 vs 賃貸：住宅コストと住宅市場トレンド',
      summary: '住宅ローン金利の高止まりや住宅価格の上昇を踏まえ、賃貸と住宅購入のコスト比較および米国の住宅市場全体の動向を分析。',
      points: [
        '【住宅コスト比較】住宅ローン金利と家賃水準の推移から見る購入・賃貸の損得分岐',
        '【市場動向】住宅供給不足と高金利環境が引き起こす住宅市場の流動性低下',
        '【インフレ影響】消費者物価指数（CPI）の約3分の1を占める住居費（Shelter）の今後の見通し'
      ],
      category: 'inflation'
    };
  }

  // 7. 地域別・都市別雇用動向
  if (t.includes('state and metro employment') || t.includes('metro employment') || t.includes('regional')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】全米の地域別・都市別雇用データ分析',
      summary: '全米各州および主要都市圏（メトロポリタン地域）における雇用創出ペースのばらつきと地域経済の健全性を比較。',
      points: [
        '【地域間格差】サンベルト地域や主要都市圏での雇用の底堅さと減速地域の対比',
        '【産業別雇用】製造業・サービス業・ハイテク産業の地域的な偏りと雇用変化',
        '【景気先行性】全国統計に先行して現れる地方経済の雇用減速シグナル'
      ],
      category: 'employment'
    };
  }

  // 8. 最低賃金と生活費
  if (t.includes('minimum wages') || t.includes('living cost') || t.includes('wage')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】州別最低賃金と生活費・インフレコストの比較分析',
      summary: '各州の最低賃金の引き上げが低所得者層の購買力や生活費、および地域的な賃金インフレに与えた影響を検証。',
      points: [
        '【実質賃金】インフレ進行による最低賃金の実質的な購買力変化',
        '【企業コスト】賃金引き上げが飲食・小売などサービス業の価格転嫁に与える影響',
        '【労働供給】賃金水準と労働参加率（LFPR）の相関関係'
      ],
      category: 'employment'
    };
  }

  // 9. 労働市場ダイナミクス・転職離職
  if (t.includes('labor market dynamics') || t.includes('change jobs') || t.includes('turnover') || t.includes('job opening')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】労働市場ダイナミクス：転職・離職動向と雇用の流動性',
      summary: '毎月数百万人が転職・離職する米国労働市場の流動性データと、就業移動が賃金や求人充足に与える影響を分析。',
      points: [
        '【雇用の流動性】自発的離職（Quits）と解雇率の推移から見る労働市場の引き締まり度',
        '【賃金プレミアム】転職者と勤続者の賃金上昇率格差（Wage Growth）の推移',
        '【需給バランス】求人件数と失業者数の比率（V/U比率）の正常化トレンド'
      ],
      category: 'employment'
    };
  }

  // 10. 雇用統計ベンチマーク改定
  if (t.includes('benchmark revision') || t.includes('employment benchmark') || t.includes('establishment survey')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】雇用統計ベンチマーク年次改定の読み解き方',
      summary: 'BLSによる雇用統計の年次ベンチマーク改定の仕組みと、速報値と確定値の乖離要因（事業所サンプル推計）を解説。',
      points: [
        '【改定の仕組み】納税記録（QCEW）に基づく非農業部門雇用者数の年次遡及改定',
        '【速報値との乖離】誕生・消滅モデル（Birth-Death Model）が推計に与える影響',
        '【実体経済への示唆】改定データから浮かび上がる基調的な雇用創出力の実態'
      ],
      category: 'employment'
    };
  }

  // 11. 季節調整と産業別雇用
  if (t.includes('seasonal') || t.includes('construction employment') || t.includes('industry employment')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】季節調整と産業別雇用の変動分析',
      summary: '天候要因や季節的変動（建設業・教育・観光等）が雇用統計の月次データに与える影響と、真のトレンドの見極め方を解説。',
      points: [
        '【季節調整要因】夏期休暇や天候異変が単月の雇用増減に及ぼす歪みの補正',
        '【主要セクター】ヘルスケア・政府・建設など雇用を牽引する特定産業の偏り',
        '【基調判断】単月の振れに惑わされない3ヶ月・6ヶ月移動平均によるトレンド把握'
      ],
      category: 'employment'
    };
  }

  // 12. 銀行の保有証券
  if (t.includes('securities do fdic') || t.includes('bank securities') || t.includes('banking system')) {
    return {
      isValid: true,
      title: '【連銀エコノミスト解説】米銀が保有する証券の内訳：銀行システムと保有資産動向',
      summary: '米国の商業銀行が保有する国債や住宅ローン担保証券（MBS）の保有比率と、金利変動に伴う評価損益・流動性リスクを分析。',
      points: [
        '【資産構成】米国債や政府系機関債など安全資産の保有比率とポートフォリオ構造',
        '【金利リスク】金利上昇局面における保有債券の含み損と銀行の自己資本比率',
        '【システム健全性】地銀再編以降の流動性バッファーの確保状況と預金動向'
      ],
      category: 'market'
    };
  }

  // 13. マップ更新などのマイナーな管理系記事、または未翻訳の定型文記事は無効（非表示）とする
  return {
    isValid: false,
    title: '',
    summary: '',
    points: [],
    category: 'market'
  };
}

// クライアント側で最新のニュース・解説を補完・統合・厳選する
export function enrichNewsWithLatestInsights(newsList: MacroNewsItem[]): MacroNewsItem[] {
  // 実戦的で華やかな最新マクロ・NY市場ハイライト（テーマ別に整理）
  const LATEST_CURATED_INSIGHTS: MacroNewsItem[] = [
    // 本日10/29発表：PCEデフレーター
    {
      id: 'pce-sep-2026',
      date: '2026-10-29',
      title: '【米PCE速報】9月PCEデフレーター+3.65%・コア+3.12%：インフレ高止まりが鮮明',
      summary: '米商務省（BEA）が10月29日に発表した9月の個人消費支出（PCE）価格指数は前年比+3.65%、FRBが最重要視するコアPCEは+3.12%となりました。エネルギー高とサービス価格の粘着性により、2%目標への回帰の遅れが警戒されています。',
      points: [
        '【PCE総合・コア】総合PCEは前年比+3.65%、コアPCEは+3.12%と依然目標を上回る推移',
        '【背景要因】原油高に伴うガソリン価格の上昇と、住居費・外食などサービスインフレの粘着性',
        '【FRBへの影響】次週11/5のFOMC会合を控え、早期利下げ観測を後退させ引き締め姿勢を支持'
      ],
      source: 'Bureau of Economic Analysis (BEA)',
      category: 'inflation',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/PCEPI',
      badge: 'PCE物価速報'
    },
    // 本日10/29発表：GDP速報値
    {
      id: 'gdp-q3-2026',
      date: '2026-10-29',
      title: '【米実質GDP速報】第3四半期実質GDP+5.61%（年率）：米経済の底堅い拡大が継続',
      summary: '米商務省（BEA）が10月29日に発表した2026年第3四半期（7〜9月期）の実質国内総生産（GDP）速報値は、前期比年率+5.61%と力強い伸びを記録しました。個人消費の堅調さと設備投資の回復が成長を牽引しています。',
      points: [
        '【経済成長力】前期比年率+5.61%と事前予想を上回る力強い景気拡大ペースを維持',
        '【個人消費】高金利環境下でも個人消費支出が堅調を維持し、米経済全体の牽引役に',
        '【市場の受け止め】景気後退（リセッション）懸念が完全に払拭され、高金利長期化シナリオが定着'
      ],
      source: 'Bureau of Economic Analysis (BEA)',
      category: 'growth',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/GDP',
      badge: 'GDP成長率速報'
    },
    // NY市場総括1: 原油高と長期金利
    {
      id: 'ny-market-yields-oil',
      date: '2026-10-27',
      title: '【NY金融市場総括】原油高と米10年債金利5%台高止まり：株式市場への下押し圧力',
      summary: '10月を通して米10年債利回りが一時5.0%〜5.3%超まで上昇し、株式市場全体の強い重しとなりました。中東情勢の緊張に伴うWTI原油急伸とインフレの粘着性を背景に、市場ではFRBによる高金利政策の長期化シナリオが意識されています。',
      points: [
        '【長期金利高騰】米10年国債利回りが一時5.3%超まで急伸。借入コスト上昇が株価のバリュエーションを圧迫',
        '【エネルギー高】原油価格の上昇によりインフレ再燃リスクが意識され、債券市場の売りを誘発',
        '【政策の長期化】景気底堅さと物価高止まりを受け、市場は「Higher for Longer（高金利長期化）」を強く織り込み'
      ],
      source: 'Wall Street Market Summary (NY市場)',
      category: 'market',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/DGS10',
      badge: 'NY市場総括'
    },
    // NY市場総括2: AI半導体・メガテック決算
    {
      id: 'ny-tech-ai-capex',
      date: '2026-10-25',
      title: '【ハイテク・AI動向】巨額AI投資（CapEx）と採算性への懸念：メガテック決算の選別色が鮮明',
      summary: '10月後半にかけてAI・半導体関連株のボラティリティが急増。大手テック企業によるデータセンター・AI向け巨額設備投資が膨らむ一方、短期的収益化の遅れや資金調達コスト上昇への警戒感から、Alphabet等の主要決算で銘柄ごとの騰落選別が強まりました。',
      points: [
        '【巨額CapEx負担】メガテック各社の大規模AIインフラ投資継続に対し、市場は短期的な投資回収効率を厳格審査',
        '【決算選別】AI収益化の進捗とクラウド成長率の違いにより、ハイテク大手間での株価二極化が顕著に',
        '【半導体サプライチェーン】先端GPU・サーバー需要は高水準も、調達コスト上昇と在庫循環への警戒が交錯'
      ],
      source: 'Wall Street Tech Focus (NY市場)',
      category: 'growth',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/NASDAQCOM',
      badge: 'AIテック動向'
    },
    // NY市場総括3: 消費者マインドとK字型二極化
    {
      id: 'ny-consumer-k-shaped',
      date: '2026-10-20',
      title: '【米景気・個人消費】CB消費者信頼感指数と消費の「K字型」二極化：インフレ・ローン負担の格差',
      summary: '10月の米コンファレンス・ボード（CB）消費者信頼感指数は91.7と改善を見せたものの、先行き期待指数は依然警戒ライン（80）を下回って推移。株高の恩恵を受ける富裕層の消費が底堅い一方、金利高・エネルギー高が中低所得層の負担となる「K字型消費」が進展しています。',
      points: [
        '【期待指数の低迷】現状判断は改善するも、6ヶ月先を見据えた期待指数は景気後退シグナルの80割れが継続',
        '【消費の二極化】高所得層の資産効果（株高・住宅高）と、ローン金利・生活費高騰に直面する中低所得層の格差拡大',
        '【小売への影響】生活必需品ディスカウンターが堅調な一方、高額耐久消費財や一般小売には慎重姿勢が定着'
      ],
      category: 'growth',
      impact: 'Medium',
      source: 'U.S. Consumer Trends (NY市場)',
      link: 'https://fred.stlouisfed.org/series/UMCSENT',
      badge: '消費動向分析'
    },
    // NY市場総括4: NY州エンパイア景況指数
    {
      id: 'ny-empire-state-survey',
      date: '2026-10-16',
      title: '【NY州地域指標】エンパイア・ステート製造業景況指数の急回復：底堅さと価格支払指数の高止まり',
      summary: 'ニューヨーク連銀が発表した10月のエンパイア・ステート製造業景況指数（Empire State Manufacturing Survey）は急回復し、近年の高水準を記録。製造業の底堅さが示される一方、仕入価格（価格支払指数）の高止まりなどインフレ圧力の残存も浮き彫りとなりました。',
      points: [
        '【指数の急反発】新規受注および出荷指数の急改善により、NY州の製造業マインドが力強く回復',
        '【仕入価格の上昇】原材料やエネルギーコストの価格支払指数が高止まりし、インフレ粘着性を裏付け',
        '【全国統計への先行性】東部製造業の回復シグナルは、今後の全米ISM製造業指数の先行指標として注目'
      ],
      source: 'Federal Reserve Bank of New York (NY連銀)',
      category: 'growth',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/INDPRO',
      badge: 'NY連銀指標'
    },
    // 10/14発表：CPI
    {
      id: 'cpi-oct-2026',
      date: '2026-10-14',
      title: '【米CPI速報】9月消費者物価指数：前年比+3.7%へ再加速！インフレ警戒感強まる',
      summary: '10月14日に米労働統計局（BLS）より発表された9月CPIは前年比+3.72%となり、前月から上昇しました。原油・エネルギー価格の上昇と住居費の下げ渋りが寄与。コアCPIは前年比+2.57%となっています。',
      points: [
        '【総合インフレ】CPIは前年比+3.72%へ再加速。エネルギー価格高騰が主な押し上げ要因',
        '【コアCPI】コア指標は前年比+2.57%と底堅い水準で推移',
        '【政策判断への示唆】インフレ高止まりにより、FRBのタカ派スタンスおよび金利高止まり観測を補強'
      ],
      source: 'Bureau of Labor Statistics (BLS)',
      category: 'inflation',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/CPIAUCSL',
      badge: '物価指標速報'
    },
    // 10/02発表：雇用統計
    {
      id: 'nfp-oct-2026',
      date: '2026-10-02',
      title: '【米雇用統計速報】9月雇用者数+2.9万人へ急減速・失業率4.2%：労働市場の軟化が進行',
      summary: '9月の米非農業部門雇用者数は前月比+2.9万人と急減速（前月分も+13.3万人へ下方修正）。失業率は4.2%へ小幅上昇しました。平均時給は前年比+3.0%へ落ち着き、労働参加率は62.7%で推移しています。',
      points: [
        '【雇用者数】非農業部門雇用者数は+2.9万人と大幅鈍化。採用ペースの明確な減速を示す',
        '【失業率・賃金】失業率は4.2%へ小幅上昇。平均時給は前年比+3.0%へ鈍化し賃金インフレは沈静化',
        '【市場への影響】労働市場の急速な冷え込みにより、次回FOMCでの政策金利判断に注目が集まる'
      ],
      source: 'Bureau of Labor Statistics (BLS)',
      category: 'employment',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/PAYEMS',
      badge: '雇用統計速報'
    },
    // 9/16発表：FOMC利上げ
    {
      id: 'fomc-sep-2026',
      date: '2026-09-16',
      title: '【FOMC速報】FRBが0.25%利上げを決定（3.75%〜4.00%）！約3年ぶり利上げ再開',
      summary: 'FRBは9月16日のFOMC会合で、政策金利（FFレート）を0.25%引き上げ「3.75%〜4.00%」とすることを全会一致で決定しました。経済の底堅さと原油高・地政学リスクに伴うインフレ高止まりを警戒し、タカ派姿勢へのシフトを明確にしました。',
      points: [
        '【利上げ決定】政策金利を0.25%引き上げ「3.75%〜4.00%」へ（2023年7月以来、約3年2ヶ月ぶり）',
        '【実施背景】米国内支出の強い底堅さと、原油高・中東情勢によるインフレ高止まりリスク',
        '【今後の見通し】ドットチャートでは年内の追加利上げを示唆。物価抑制を最優先する姿勢'
      ],
      source: 'Federal Reserve Board (FRB)',
      category: 'policy',
      impact: 'High',
      link: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm',
      badge: 'FOMC利上げ決定'
    }
  ];

  // 1. 各記事をフォーマット＆HTMLデコード＆定型文の排除
  const processedNewsList: MacroNewsItem[] = [];

  newsList.forEach(item => {
    let itemCopy = { ...item };
    itemCopy.title = stripPrefix(decodeHtmlEntities(itemCopy.title));
    itemCopy.summary = decodeHtmlEntities(itemCopy.summary);

    if (itemCopy.points) {
      itemCopy.points = itemCopy.points.map(p => decodeHtmlEntities(p));
    }

    // FRED Blog / NY連銀 記事の場合
    if (itemCopy.source.includes('FRED Blog') || itemCopy.id.startsWith('fred-blog-') || itemCopy.source.includes('New York') || itemCopy.id.startsWith('nyfed-blog-')) {
      const meta = getFredBlogDetail(itemCopy.title, itemCopy.summary);
      if (!meta.isValid) {
        // 未翻訳の英語タイトルやコピペ定型文の記事は完全スキップ（一覧に出さない！）
        return;
      }
      itemCopy.title = meta.title;
      itemCopy.summary = meta.summary;
      itemCopy.points = meta.points;
      itemCopy.category = meta.category;
    }

    // FRB公式発表の整形
    if (itemCopy.id.startsWith('frb-press-') || itemCopy.source.includes('Federal Reserve')) {
      const tLower = itemCopy.title.toLowerCase();
      if (tLower.includes('discount rate')) {
        itemCopy.title = '【FRB議事録】連銀公定歩合会合 議事録の公表';
        itemCopy.summary = '各地区連銀総裁からの公定歩合（割引率）要請と理事会での審議結果が公表されました。地域経済の温度差や信用状況が反映されています。';
        itemCopy.points = [
          '【各地区連銀の要請】全米各地域の景況感と金利要請スタンス',
          '【信用動向】金融機関の資金調達動向と流動性環境の確認',
          '【政策波及】本会合に向けた地区ごとの経済見通しの差異'
        ];
      } else if (tLower.includes('minutes') && tLower.includes('open market committee')) {
        itemCopy.title = '【FOMC議事要旨】連邦公開市場委員会 議事要旨の公表';
        itemCopy.summary = '前回のFOMC会合における政策金利判断の議論詳細が公表されました。インフレ見通しや労働市場の評価、金融引き締めの継続期間に関する連銀幹部の議論が記録されています。';
        itemCopy.points = [
          '【議論内容】金融政策運営方針と参加者ごとの景気・物価認識の詳細',
          '【インフレ警戒】エネルギー価格やサービスインフレに対する政策委員の評価',
          '【先行きの舵取り】経済指標に応じた今後の金利調整スタンス'
        ];
      }
    }

    // CNBCなどの市場記事の場合、英語の生タイトルは除外（華やかな日本語サマリーのみに厳選）
    if (itemCopy.source.includes('CNBC') || itemCopy.id.startsWith('cnbc-')) {
      return; // 英語の生ヘッドラインは除外
    }

    processedNewsList.push(itemCopy);
  });

  // 2. 重複排除（Deduplication）ロジック
  const filteredProcessed = processedNewsList.filter(item => {
    const titleLower = item.title.toLowerCase();
    const isGenericFomc = (titleLower.includes('fomc') && titleLower.includes('政策金利') && item.id.startsWith('frb-press-')) ||
                          (titleLower.includes('fomc statement') && item.id.startsWith('frb-press-'));
    if (isGenericFomc) {
      return false;
    }
    return true;
  });

  const existingIds = new Set(filteredProcessed.map(n => n.id));
  const merged = [...filteredProcessed];

  LATEST_CURATED_INSIGHTS.forEach(insight => {
    if (!existingIds.has(insight.id)) {
      merged.push(insight);
      existingIds.add(insight.id);
    }
  });

  return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
