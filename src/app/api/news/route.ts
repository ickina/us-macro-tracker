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
}

export const dynamic = 'force-static';

const MOCK_NEWS: MacroNewsItem[] = [
  {
    id: 'news-1',
    date: '2026-08-20',
    title: 'FOMC議事要旨：年内の追加利下げに向けインフレ鈍化と雇用動向を注視',
    summary: '連邦準備制度理事会（FRB）は公表した最新のFOMC議事録において、インフレ率が目標の2%に向かって持続的に低下していることを確認しつつも、労働市場の軟化リスクを警戒する姿勢を鮮明にした。',
    source: 'Federal Reserve Board (FRB)',
    category: 'policy',
    impact: 'High',
    link: 'https://www.federalreserve.gov'
  },
  {
    id: 'news-2',
    date: '2026-08-18',
    title: '米10年債利回りと2年債利回りのスプレッド縮小：逆イールド解消後の市場動向',
    summary: '長短金利差（10Y-2Y）がプラス圏へと浮上したことを受け、市場では過去の景気サイクルにおける景気後退シグナルの発現パターンについての検証が活発化している。',
    source: 'FRED Economic Research',
    category: 'market',
    impact: 'High',
    link: 'https://fred.stlouisfed.org'
  },
  {
    id: 'news-3',
    date: '2026-08-14',
    title: '米7月消費者物価指数（CPI）：前年比+2.9%へ小幅鈍化、住居費インフレも軟化傾向',
    summary: '米労働省（BLS）発表の7月CPIは市場予想と一致。コアCPIも落ち着きを見せ、FRBの物価安定目標に向けた進展が継続していることが確認された。',
    source: 'Bureau of Labor Statistics (BLS)',
    category: 'inflation',
    impact: 'High',
    link: 'https://www.bls.gov/cpi/'
  },
  {
    id: 'news-4',
    date: '2026-08-12',
    title: '米7月小売売上高（Retail Sales）：前月比+0.4%で個人消費の底堅さを示す',
    summary: '商務省発表の小売売上高は市場予想を上回る堅調な伸びを記録。高金利環境下でも米国の個人消費と家計の購買力が維持されていることを裏付けた。',
    source: 'U.S. Census Bureau',
    category: 'growth',
    impact: 'Medium',
    link: 'https://www.census.gov/retail/'
  },
  {
    id: 'news-5',
    date: '2026-08-08',
    title: '米7月雇用統計（NFP）：非農業部門雇用者数+16.5万人、失業率は3.9%で横ばい',
    summary: '労働市場は急激な悪化を避けつつ、需給バランスの正常化（ソフトランディング）に向かうペースを維持していると評価されている。',
    source: 'Bureau of Labor Statistics (BLS)',
    category: 'employment',
    impact: 'High',
    link: 'https://www.bls.gov/ces/'
  },
  {
    id: 'news-6',
    date: '2026-08-05',
    title: 'FRBバランスシート（QT）：量的引き締め継続に伴うリバースレポ残高の推移',
    summary: 'FRBの総資産規模は着実に縮小を続けており、金融システム内の余剰流動性と短期金融市場の金利安定性が保たれている。',
    source: 'Federal Reserve Bank of St. Louis',
    category: 'policy',
    impact: 'Medium',
    link: 'https://fred.stlouisfed.org/series/WALCL'
  }
];

export async function GET() {
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!FRED_API_KEY || FRED_API_KEY === 'YOUR_FRED_API_KEY_HERE') {
    return NextResponse.json({ success: true, data: MOCK_NEWS });
  }

  try {
    // FRED Releases API から公式リリース情報を取得
    const url = `https://api.stlouisfed.org/fred/releases?api_key=${FRED_API_KEY}&file_type=json&limit=20&sort_order=desc`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: MOCK_NEWS });
    }

    const data = await res.json();
    const releases = data.releases || [];

    if (releases.length === 0) {
      return NextResponse.json({ success: true, data: MOCK_NEWS });
    }

    // FRED Releases と MOCK_NEWS を統合
    const formattedReleases: MacroNewsItem[] = releases.slice(0, 10).map((r: any) => ({
      id: `release-${r.id}`,
      date: r.realtime_start || new Date().toISOString().split('T')[0],
      title: `【公式発表】${r.name}`,
      summary: `FREDデータベースにおいて公式データ「${r.name}」の最新リリースおよび時系列更新が記録されました。`,
      source: r.link ? new URL(r.link).hostname : 'FRED St. Louis Fed',
      category: r.name.includes('Price') || r.name.includes('CPI') ? 'inflation' : r.name.includes('Employment') ? 'employment' : 'growth',
      impact: r.press_release ? 'High' : 'Medium',
      link: r.link || `https://fred.stlouisfed.org/releases`
    }));

    const allNews = [...MOCK_NEWS, ...formattedReleases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ success: true, data: allNews });
  } catch (error) {
    console.error('Error in /api/news:', error);
    return NextResponse.json({ success: true, data: MOCK_NEWS });
  }
}
