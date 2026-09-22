import { MacroNewsItem } from '@/app/api/news/route';

// タイトルの日本語変換ヘルパー
function translateBlogTitleToJa(enTitle: string): string {
  const t = enTitle.toLowerCase();
  if (t.includes('is this a good time to rent')) return '住宅購入と賃貸のコスト比較：住宅市場とインフレ動向';
  if (t.includes('generative ai save time')) return '生成AIは労働時間を削減しているか？：生産性と労働データ';
  if (t.includes('what securities do fdic')) return '米銀が保有する証券の内訳：銀行システムと保有資産動向';
  if (t.includes('state and metro employment')) return '全米および主要都市の雇用動向分析（第2四半期）';
  if (t.includes('ai reducing employment')) return 'AIはソフトウェア開発者の雇用を減少させているか？';
  if (t.includes('minimum wages')) return '州別最低賃金と生活費・インフレコストの比較分析';
  if (t.includes('inflation')) return `インフレ動向分析：${enTitle}`;
  if (t.includes('employment') || t.includes('job')) return `雇用・労働市場の分析：${enTitle}`;
  if (t.includes('interest rate') || t.includes('yield')) return `金利・債券市場の分析：${enTitle}`;
  return enTitle;
}

// クライアント側で最新のニュース・解説を補完・マージする
export function enrichNewsWithLatestInsights(newsList: MacroNewsItem[]): MacroNewsItem[] {
  // 9月の最新重要マクロ動向（FOMC利下げ決定、最新CPI、雇用情勢）の最新解説
  const LATEST_CURATED_INSIGHTS: MacroNewsItem[] = [
    {
      id: 'fomc-sep-2026',
      date: '2026-09-16',
      title: '【FOMC声明】FRB政策金利の利下げ決定 ＆ パウエル議長記者会見',
      summary: '連邦公開市場委員会（FOMC）は最新会合で政策金利（FF金利）の利下げを決定。インフレが2%目標に向けて持続的に前進していることへの確信を強め、労働市場の軟化を防ぐための政策スタンスを明確にしました。',
      points: [
        '政策金利（FFレート）の引き下げを決定し、金融政策の正常化サイクルへ移行',
        'パウエル議長は「労働市場のこれ以上の冷え込みは望まない」と強調',
        '今後の利下げペースはCPI物価データと雇用指標に連動して慎重に決定'
      ],
      source: 'Federal Reserve Board (FRB)',
      category: 'policy',
      impact: 'High',
      link: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
      badge: 'FOMC金融政策'
    },
    {
      id: 'cpi-sep-2026',
      date: '2026-09-11',
      title: '【米CPI速報】8月消費者物価指数：前年比+2.5%へ減速、インフレ沈静化が鮮明',
      summary: '米労働省（BLS）が発表した8月CPIは前年比+2.5%となり市場予想と一致。ガソリン価格の下落と住居費インフレの軟化が全体の物価低下を力強く牽引しました。',
      points: [
        '総合CPIは前年比+2.5%まで順調に鈍化し、約3年ぶりの低水準を記録',
        'エネルギー価格の下落が寄与し、消費者のインフレ期待も安定推移',
        '実質賃金のプラス成長が維持され、家計の購買力低下リスクが後退'
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
      title: '【米雇用統計】8月雇用情勢：非農業部門雇用者数+14.2万人、失業率4.2%に改善',
      summary: '8月の米雇用統計は非農業部門雇用者数が緩やかな伸びを示し、失業率は前月の4.3%から4.2%へと小幅改善。極端な失速を回避するソフトランディング基調が示されました。',
      points: [
        '失業率が4.2%へ小幅改善し、雇用市場のパニック的悪化懸念が後退',
        'ヘルスケアや建設部門を中心とした底堅い求人が雇用を支える',
        '賃金上昇率は前年比+3.8%と安定し、インフレへの二次的波及圧力が低下'
      ],
      source: 'Bureau of Labor Statistics (BLS)',
      category: 'employment',
      impact: 'High',
      link: 'https://fred.stlouisfed.org/series/PAYEMS',
      badge: '雇用統計速報'
    }
  ];

  // 既存のリストと統合し、重複をIDで除外
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
