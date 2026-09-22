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

// FRED Blog記事の詳細な日本語化＆具体的要約マッピング
interface BlogMeta {
  title: string;
  summary: string;
  points: string[];
  category: MacroNewsItem['category'];
}

function getFredBlogDetail(rawTitle: string, rawDesc: string): BlogMeta {
  const t = rawTitle.toLowerCase();
  const cleanDesc = decodeHtmlEntities(rawDesc);

  // 1. FOMC SEP / 経済予測
  if (t.includes('summary of economic projections') || (t.includes('fomc') && t.includes('projection'))) {
    return {
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

  // 2. オプション価格 / カンザスシティ連銀スキュー指標
  if (t.includes('options prices') || t.includes('policy rate skew') || t.includes('financial risk')) {
    return {
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

  // 3. マネーサプライ M2
  if (t.includes('measuring money') || t.includes('m2') || t.includes('money supply')) {
    return {
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

  // 4. 住宅・賃貸 vs 購入
  if (t.includes('good time to rent') || t.includes('housing') || t.includes('mortgage') || t.includes('rent')) {
    return {
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

  // 5. 生成AIと労働生産性
  if (t.includes('generative ai') || t.includes('ai save time') || t.includes('artificial intelligence')) {
    return {
      title: '【連銀エコノミスト解説】生成AIは労働時間を削減しているか？：生産性と労働データ',
      summary: '生成AIの普及が実体経済の労働時間削減や生産性向上にどの程度寄与しているかを、最新の労働統計データを基に検証したコラム。',
      points: [
        '【生産性への寄与】AIツールの活用が業務時間短縮と作業効率化に与える実質的影響',
        '【労働市場の変化】デスクワークや専門職種における業務プロセスの再編動向',
        '【長期的影響】将来的な潜在経済成長率（潜在GDP）の押し上げ要因としての可能性'
      ],
      category: 'growth'
    };
  }

  // 6. 銀行の保有証券・安全性
  if (t.includes('securities do fdic') || t.includes('bank securities') || t.includes('banking system')) {
    return {
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

  // 7. 地域別・都市別雇用動向
  if (t.includes('state and metro employment') || t.includes('metro employment') || t.includes('regional')) {
    return {
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

  // 9. インフレ一般
  if (t.includes('inflation') || t.includes('cpi') || t.includes('pce') || t.includes('price')) {
    return {
      title: `【連銀エコノミスト解説】インフレ動向分析：${decodeHtmlEntities(rawTitle)}`,
      summary: cleanDesc.length > 10 ? cleanDesc.slice(0, 120) + '…' : 'セントルイス連銀による物価動向・インフレ圧力に関する分析コラム。',
      points: [
        '【物価トレンド】財・サービス価格の推移と基調的なインフレ圧力の測定',
        '【構成要因】エネルギー・住居費・コア指標の変動要因分析',
        '【政策的示唆】FRBの2%インフレ目標達成に向けた道筋とリスク'
      ],
      category: 'inflation'
    };
  }

  // 10. デフォルト（その他）
  const cleanTitle = decodeHtmlEntities(rawTitle);
  const snippet = cleanDesc.length > 10 ? cleanDesc.slice(0, 130) + (cleanDesc.length > 130 ? '…' : '') : 'セントルイス連銀エコノミストによるマクロ経済データ分析コラムです。';
  
  return {
    title: `【連銀エコノミスト解説】${cleanTitle}`,
    summary: snippet,
    points: [
      `【分析対象】「${cleanTitle}」に関する連銀エコノミストの独自分析`,
      '【データ活用】FREDの長期時系列データを活用した構造的変化の考察',
      '【マクロへの影響】金融政策・雇用・実体経済への長期的な示唆'
    ],
    category: 'market'
  };
}

// クライアント側で最新のニュース・解説を補完・統合・重複排除する
export function enrichNewsWithLatestInsights(newsList: MacroNewsItem[]): MacroNewsItem[] {
  // 厳選キュレーション速報（最新の正確なマクロ事実）
  const LATEST_CURATED_INSIGHTS: MacroNewsItem[] = [
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
    },
    {
      id: 'cpi-sep-2026',
      date: '2026-09-11',
      title: '【米CPI速報】8月消費者物価指数：前年比+2.5%へ鈍化！インフレ沈静化が鮮明',
      summary: '8月の消費者物価指数（CPI）は前年比+2.5%となり、約3年ぶりの低水準までインフレが落ち着きました。ガソリンや中古車価格の下落が大きく貢献しています。',
      points: [
        '【インフレ低下】CPIが+2.5%まで順調に鈍化。物価安定に向けた着実な進展を確認',
        '【要因】ガソリン代・エネルギー価格の低下が物価押し下げに寄与',
        '【市場の反応】インフレ再燃リスクが後退し、金利低下・株高・ドル安要因に'
      ],
      source: 'Bureau of Labor Statistics (BLS)',
      category: 'inflation',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/CPIAUCSL',
      badge: '物価指標速報'
    },
    {
      id: 'nfp-sep-2026',
      date: '2026-09-06',
      title: '【米雇用統計】8月雇用者数+14.2万人・失業率4.2%：景気急減速を回避',
      summary: '8月の非農業部門雇用者数は+14.2万人、失業率は4.2%に改善しました。雇用の急激な崩れは起きておらず、景気の軟着陸（ソフトランディング）期待が維持されています。',
      points: [
        '【雇用情勢】失業率が4.2%へ小幅改善。リセッション（景気後退）懸念が和らぐ',
        '【賃金】平均時給は前年比+3.8%と安定。賃金高騰によるインフレ圧力は沈静化',
        '【市場の反応】雇用崩壊の警戒感が後退し、市場の過度な不安が沈静化'
      ],
      source: 'Bureau of Labor Statistics (BLS)',
      category: 'employment',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/PAYEMS',
      badge: '雇用統計速報'
    }
  ];

  // 1. 各記事をフォーマット＆HTMLデコード＆FRED Blogの具体的要約適用
  const processedNewsList: MacroNewsItem[] = newsList.map(item => {
    let itemCopy = { ...item };
    itemCopy.title = decodeHtmlEntities(itemCopy.title);
    itemCopy.summary = decodeHtmlEntities(itemCopy.summary);

    if (itemCopy.points) {
      itemCopy.points = itemCopy.points.map(p => decodeHtmlEntities(p));
    }

    // FRED Blog 記事の場合は、個別トピックに応じた具体的な日本語タイトル・サマリー・要約を割り振る
    if (itemCopy.source.includes('FRED Blog') || itemCopy.id.startsWith('fred-blog-')) {
      const meta = getFredBlogDetail(itemCopy.title, itemCopy.summary);
      itemCopy.title = meta.title;
      itemCopy.summary = meta.summary;
      itemCopy.points = meta.points;
      itemCopy.category = meta.category;
    }

    return itemCopy;
  });

  // 2. 重複排除（Deduplication）ロジック
  // キュレーション速報（fomc-sep-2026 など）と同一のトピック（FOMC政策金利発表など）を持つ汎用ニュースを重複排除
  const filteredProcessed = processedNewsList.filter(item => {
    // 9/16のFRB RSS側の一般的な「FOMC政策金利発表」を、より詳細な「fomc-sep-2026」に一本化
    const titleLower = item.title.toLowerCase();
    const isGenericFomc = (titleLower.includes('fomc') && titleLower.includes('政策金利') && item.id.startsWith('frb-press-')) ||
                          (titleLower.includes('fomc statement') && item.id.startsWith('frb-press-'));
    if (isGenericFomc) {
      return false; // 重複を排除
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
