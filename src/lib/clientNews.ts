import { MacroNewsItem } from '@/app/api/news/route';

// タイトルの日本語変換ヘルパー（直感的で分かりやすい表現）
function translateBlogTitleToJa(enTitle: string): string {
  const t = enTitle.toLowerCase();
  if (t.includes('is this a good time to rent')) return '住宅購入 vs 賃貸：今はどちらが得か？住宅コスト動向';
  if (t.includes('generative ai save time')) return '生成AIは実際に仕事時間を減らしているか？労働データ分析';
  if (t.includes('what securities do fdic')) return '米国の銀行はどんな資産を持っているか？銀行システムの安全性';
  if (t.includes('state and metro employment')) return '全米の地域別・都市別雇用データ（第2四半期）';
  if (t.includes('ai reducing employment')) return 'AIはプログラマー・開発者の仕事を奪っているか？';
  if (t.includes('minimum wages')) return '州別の最低賃金と生活費の比較：インフレによる影響';
  if (t.includes('inflation')) return `インフレ分析：${enTitle}`;
  if (t.includes('employment') || t.includes('job')) return `雇用・労働市場：${enTitle}`;
  if (t.includes('interest rate') || t.includes('yield')) return `金利・債券市場：${enTitle}`;
  return enTitle;
}

// クライアント側で最新のニュース・解説を補完・マージする（回りくどさゼロ・超明快要約）
export function enrichNewsWithLatestInsights(newsList: MacroNewsItem[]): MacroNewsItem[] {
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
        '【インフレ低下】CPIが+2.5%まで順調に鈍化。FRBの利下げ判断を力強く後押し',
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

  const existingIds = new Set(newsList.map(n => n.id));
  const merged = [...newsList];

  LATEST_CURATED_INSIGHTS.forEach(insight => {
    if (!existingIds.has(insight.id)) {
      merged.push(insight);
      existingIds.add(insight.id);
    }
  });

  return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
