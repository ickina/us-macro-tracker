import { NextResponse } from 'next/server';

export interface MacroNewsItem {
  id: string;
  date: string;
  title: string;
  summary: string;
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
    title: '【FRB動向】パウエル議長発言とジャクソンホール会合：政策金利の調整局面へ',
    summary: '連邦準備制度（FRB）はインフレ鈍化と労働市場の需給バランス正常化を踏まえ、景気抑制的な金融政策から中立水準への利下げペースについて慎重に議論を進めている。',
    source: 'Federal Reserve Board (FRB)',
    category: 'policy',
    impact: 'High',
    link: 'https://www.federalreserve.gov',
    badge: '金融政策'
  },
  {
    id: 'insight-2',
    date: '2026-08-25',
    title: '【金利・為替】10年債利回りとドル円相場の相関：日米金利差の縮小観測',
    summary: '米10年国債利回りの低下と日銀の金融政策正常化観測が交錯する中、ドル円レートはボラティリティを保ちつつ推移。実質金利の推移が今後の市場心理を左右する。',
    source: 'FRED Economic Research',
    category: 'market',
    impact: 'High',
    link: 'https://fred.stlouisfed.org',
    badge: '市場動向'
  },
  {
    id: 'insight-3',
    date: '2026-08-20',
    title: '【物価分析】PCEデフレーターとコアインフレの基調：目標2%への収束状況',
    summary: '家賃などの住居費インフレが緩やかな低下傾向を示し、サービス価格の高止まりリスクが後退。モノとサービス両面でのインフレ沈静化が確認されている。',
    source: 'Bureau of Economic Analysis (BEA)',
    category: 'inflation',
    impact: 'High',
    link: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index',
    badge: 'インフレ'
  },
  {
    id: 'insight-4',
    date: '2026-08-15',
    title: '【雇用・労働】失業率と新規失業保険申請件数から見る米雇用環境の実態',
    summary: '雇用の急激な縮小はみられないものの、求人倍率の低下とともに賃金上昇圧力が緩和。ソフトランディング期待を支えるデータ推移が続いている。',
    source: 'Bureau of Labor Statistics (BLS)',
    category: 'employment',
    impact: 'High',
    link: 'https://www.bls.gov/news.release/empsit.nr0.htm',
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
              title: `【公式発表】${matched.name} (${r.name})`,
              summary: `米連邦政府・関係機関より「${matched.name}」の最新公式データが更新されました。時系列トレンドおよびマクロ経済への影響が記録されています。`,
              source: r.link ? new URL(r.link).hostname : 'FRED Official Release',
              category: matched.category,
              impact: matched.impact,
              link: r.link || `https://fred.stlouisfed.org/releases`,
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

