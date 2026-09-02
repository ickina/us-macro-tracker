import { NextResponse } from 'next/server';

export interface MacroNewsItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  points?: string[];
  source: string;
  category: 'inflation' | 'employment' | 'policy' | 'market' | 'growth';
  impact: 'High' | 'Medium' | 'Low';
  link?: string;
  badge?: string;
}

export const dynamic = 'force-static';

// 超主要指標のホワイトリスト（マイナーな学術論文データを完全排除）
const MAJOR_RELEASE_KEYWORDS = [
  { keyword: 'Consumer Price', name: '消費者物価指数 (CPI)', category: 'inflation' as const, impact: 'High' as const },
  { keyword: 'Employment Situation', name: '米雇用統計 (NFP / 失業率)', category: 'employment' as const, impact: 'High' as const },
  { keyword: 'Personal Income and Outlays', name: '個人所得・PCEデフレーター', category: 'inflation' as const, impact: 'High' as const },
  { keyword: 'Gross Domestic Product', name: '実質国内総生産 (GDP)', category: 'growth' as const, impact: 'High' as const },
  { keyword: 'Producer Price', name: '生産者物価指数 (PPI)', category: 'inflation' as const, impact: 'High' as const },
  { keyword: 'Advance Monthly Sales', name: '小売売上高 (Retail Sales)', category: 'growth' as const, impact: 'High' as const },
  { keyword: 'Industrial Production', name: '鉱工業生産指数', category: 'growth' as const, impact: 'Medium' as const },
  { keyword: 'Job Openings', name: 'JOLTS求人件数', category: 'employment' as const, impact: 'Medium' as const },
  { keyword: 'FOMC', name: 'FOMC 政策金利・声明文', category: 'policy' as const, impact: 'High' as const },
  { keyword: 'Treasury', name: '米国債利回り・入札結果', category: 'market' as const, impact: 'Medium' as const },
];

const CURATED_MACRO_INSIGHTS: MacroNewsItem[] = [
  {
    id: 'insight-1',
    date: '2026-08-28',
    title: '【FRB金融政策】パウエル議長発言と金利見通し：政策金利の調整局面へ',
    summary: '連邦準備制度（FRB）はインフレの着実な鈍化と労働市場の需給正常化を踏まえ、景気抑制的な政策金利（FF金利）の調整方針を慎重に検討しています。',
    points: [
      'FRBは物価目標2%に向けたインフレ沈静化の進展を評価',
      '雇用の急激な減速を防ぐため、予防的な利下げペースを議論',
      '今後のCPIや雇用統計データ次第で年内の利下げ幅が決定される見通し'
    ],
    source: 'Federal Reserve Board (FRB)',
    category: 'policy',
    impact: 'High',
    link: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    badge: '金融政策'
  },
  {
    id: 'insight-2',
    date: '2026-08-25',
    title: '【金利・為替】米10年債利回りとドル円相場の動向：日米金利差の推移',
    summary: '米10年国債利回りの推移とドル円（USD/JPY）相場は高い連動性を維持しています。実質金利の動向が市場心理を左右しています。',
    points: [
      '米長期金利の低下観測に伴い、ドル円の上値が重くなりやすい地合い',
      '日銀の金融政策正常化とFRBの利下げ見通しによる金利差縮小が焦点',
      '短期的なボラティリティの上昇に注意しつつ、トレンドの転換点を注視'
    ],
    source: 'FRED Economic Data',
    category: 'market',
    impact: 'High',
    link: 'https://fred.stlouisfed.org/series/DEXJPUS',
    badge: '為替・金利'
  },
  {
    id: 'insight-3',
    date: '2026-08-20',
    title: '【物価・インフレ】PCEデフレーターとコアインフレ：物価目標2%への進展',
    summary: 'FRBが最重要視するコアPCEデフレーターは前年比2%台で安定推移。サービス価格と住居費の落ち着きが確認されています。',
    points: [
      'コアPCEデフレーターは目標の2%への収束トレンドを維持',
      'サプライチェーン正常化に加え、消費者の価格感応度の上昇が価格抑制に寄与',
      'インフレ再燃リスクが限定的となり、FRBの政策判断の柔軟性が拡大'
    ],
    source: 'Bureau of Economic Analysis (BEA)',
    category: 'inflation',
    impact: 'High',
    link: 'https://fred.stlouisfed.org/series/PCEPILFE',
    badge: 'インフレ指標'
  },
  {
    id: 'insight-4',
    date: '2026-08-15',
    title: '【雇用・労働】失業率と非農業部門雇用者数（NFP）：労働市場の安定性',
    summary: '米雇用統計では非農業部門雇用者数が堅調な伸びを保ち、失業率も低水準を維持。ソフトランディング期待を支える結果となっています。',
    points: [
      '新規雇用は急減を避けつつ、持続可能なペースへと緩やかに正常化',
      '求人倍率の低下に伴い、賃金主導のインフレ圧力は大幅に沈静化',
      '米経済の底堅い成長力を裏付け、急激なリセッションリスクは後退'
    ],
    source: 'Bureau of Labor Statistics (BLS)',
    category: 'employment',
    impact: 'High',
    link: 'https://fred.stlouisfed.org/series/PAYEMS',
    badge: '雇用統計'
  }
];

// FRED Blog RSS から記事を取得してパースする関数
async function fetchFredBlogPosts(): Promise<MacroNewsItem[]> {
  try {
    const res = await fetch('https://fredblog.stlouisfed.org/feed/', {
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const items: MacroNewsItem[] = [];

    // 正規表現で <item>...</item> を抽出
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 8) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemContent.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);

      const title = titleMatch ? titleMatch[1].trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : 'https://fredblog.stlouisfed.org';
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';
      
      let date = new Date().toISOString().split('T')[0];
      if (pubDateStr) {
        const d = new Date(pubDateStr);
        if (!isNaN(d.getTime())) {
          date = d.toISOString().split('T')[0];
        }
      }

      // 要約のHTMLタグと不要な文字列を除去
      let summary = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/Continue reading.*/, '').trim() : '';
      if (!summary || summary.length < 10) {
        summary = 'セントルイス連銀のエコノミストによるマクロ経済データ分析記事です。詳細なグラフと考察が掲載されています。';
      }

      if (title) {
        items.push({
          id: `fred-blog-${count}`,
          date,
          title: `【連銀エコノミスト解説】${title}`,
          summary,
          points: [
            'セントルイス連銀のエコノミストによる最新マクロ経済分析コラム',
            'FREDの時系列データを活用した構造的トレンドの可視化と考察',
            '景気サイクル・金融市場への長期的な示唆を提供する調査レポート'
          ],
          source: 'FRED Blog (セントルイス連銀)',
          category: title.toLowerCase().includes('inflation') || title.toLowerCase().includes('price') ? 'inflation' : title.toLowerCase().includes('ai') || title.toLowerCase().includes('tech') || title.toLowerCase().includes('gdp') ? 'growth' : 'market',
          impact: 'Medium',
          link,
          badge: '連銀マクロコラム'
        });
        count++;
      }
    }

    return items;
  } catch (err) {
    console.error('Error fetching FRED Blog RSS:', err);
    return [];
  }
}

export async function GET() {
  const FRED_API_KEY = process.env.FRED_API_KEY;
  const blogPosts = await fetchFredBlogPosts();

  let majorReleases: MacroNewsItem[] = [];

  if (FRED_API_KEY && FRED_API_KEY !== 'YOUR_FRED_API_KEY_HERE') {
    try {
      const url = `https://api.stlouisfed.org/fred/releases?api_key=${FRED_API_KEY}&file_type=json&limit=50&sort_order=desc`;
      const res = await fetch(url, { next: { revalidate: 86400 } });

      if (res.ok) {
        const data = await res.json();
        const releases = data.releases || [];

        // ホワイトリスト（超主要指標）に一致するものだけを厳選
        releases.forEach((r: any) => {
          const matched = MAJOR_RELEASE_KEYWORDS.find(k => r.name.toLowerCase().includes(k.keyword.toLowerCase()));
          if (matched) {
            majorReleases.push({
              id: `release-${r.id}`,
              date: r.realtime_start || new Date().toISOString().split('T')[0],
              title: `【公式データ更新】${matched.name} (${r.name})`,
              summary: `米連邦政府・公的機関より「${matched.name}」の最新時系列データが更新されました。`,
              points: [
                `米公的機関が発表した公式統計「${matched.name}」の最新値`,
                '金融市場やFRBの金融政策判断に影響を与える重要マクロ指標',
                'ダッシュボードの各指標カードと連動してトレンドの確認が可能'
              ],
              source: r.link ? new URL(r.link).hostname : 'FRED Official Release',
              category: matched.category,
              impact: matched.impact,
              link: r.link || `https://fred.stlouisfed.org/release?rid=${r.id}`,
              badge: '公式データ発表'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching FRED releases:', error);
    }
  }

  // キュレーションされた重要解説 ＋ 連銀ブログ最新記事 ＋ 厳選された主要指標リリース を統合
  const allNews = [...CURATED_MACRO_INSIGHTS, ...blogPosts, ...majorReleases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return NextResponse.json({ success: true, data: allNews });
}

