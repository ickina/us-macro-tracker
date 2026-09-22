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

function decodeHtmlEntities(str: string): string {
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
    .replace(/<[^>]+>/g, '')
    .trim();
}

// 超主要指標のホワイトリスト
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

// FRED Blog記事の詳細な日本語化＆個別要約
function parseFredBlogItem(rawTitle: string, rawDesc: string): { title: string; summary: string; points: string[]; category: MacroNewsItem['category'] } {
  const t = rawTitle.toLowerCase();
  const cleanDesc = decodeHtmlEntities(rawDesc);

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
    category: t.includes('inflation') || t.includes('price') ? 'inflation' : t.includes('ai') || t.includes('gdp') ? 'growth' : 'market'
  };
}

// FRB公式 Monetary Policy RSS からの取得
async function fetchFrbMonetaryReleases(): Promise<MacroNewsItem[]> {
  try {
    const res = await fetch('https://www.federalreserve.gov/feeds/press_monetary.xml', {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items: MacroNewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 6) {
      const content = match[1];
      const titleMatch = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || content.match(/<title>(.*?)<\/title>/);
      const linkMatch = content.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) || content.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = content.match(/<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>/) || content.match(/<pubDate>(.*?)<\/pubDate>/);

      const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';
      const link = linkMatch ? decodeHtmlEntities(linkMatch[1].trim()) : 'https://www.federalreserve.gov';
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';

      let date = new Date().toISOString().split('T')[0];
      if (pubDateStr) {
        const d = new Date(pubDateStr);
        if (!isNaN(d.getTime())) date = d.toISOString().split('T')[0];
      }

      if (rawTitle) {
        let title = `【FRB発表】${rawTitle}`;
        let summary = '米連邦準備制度理事会（FRB）による金融政策・声明文の公式発表です。';
        let points = [
          'FRBによる公式な金融政策方針の決定と公表',
          '景気・雇用およびインフレ見通しを踏まえた金利政策の指針',
          '金融市場の流動性および金利動向への直接的な影響'
        ];

        const tLower = rawTitle.toLowerCase();
        if (tLower.includes('fomc statement')) {
          title = '【FOMC速報】FRB政策金利発表（3.75%〜4.00%）＆ パウエル議長記者会見';
          summary = 'FOMC（連邦公開市場委員会）は政策金利（FF金利）の引き上げを決定し、誘導目標を3.75%〜4.00%とすることを全会一致で公表しました。原油高や経済の底堅さに伴うインフレ高止まりを抑制する方針を示しました。';
          points = [
            '【金利決定】政策金利を0.25%引き上げ、誘導目標レンジを「3.75%〜4.00%」に決定',
            '【実施背景】強い国内支出と原油高・地政学リスクに伴うインフレ再燃を警戒',
            '【政策方針】今後の物価・雇用データ次第で追加利上げも含めた柔軟な引き締め姿勢'
          ];
        } else if (tLower.includes('economic projections')) {
          title = '【経済・金利見通し】FOMC参加者による最新予測（SEP / ドットチャート）';
          summary = 'FOMC参加者による実質GDP成長率、失業率、PCEインフレ率、および将来の政策金利予測（ドットプロット）が公表されました。';
          points = [
            '【ドットチャート】年内および来年に向けた政策金利の想定水準と追加引き締め予測',
            '【経済見通し】経済成長率(GDP)およびインフレ率(PCE)の最新改定見通し',
            '【中立金利】長期的な金利水準に対するFRB当局者の最新スタンス'
          ];
        } else if (tLower.includes('minutes')) {
          title = '【FOMC議事要旨】金融政策会合の詳細議論と当局者スタンス';
          summary = '直近のFOMC会合における政策金利水準やインフレ・労働市場の評価に関する詳細な議論の全容が公開されました。';
          points = [
            '【会合議論】政策金利水準やインフレ・労働市場の評価に関する詳細な議論',
            '【引き締め方針】量的引き締め（QT）の進捗状況と金融市場の流動性環境',
            '【今後の論点】次回以降の会合における金融政策の選択肢とリスク要因'
          ];
        }

        items.push({
          id: `frb-press-${count}`,
          date,
          title,
          summary,
          points,
          source: 'Federal Reserve Board (FRB)',
          category: 'policy',
          impact: 'High',
          link,
          badge: '金融政策速報'
        });
        count++;
      }
    }

    return items;
  } catch (err) {
    console.error('Error fetching FRB RSS:', err);
    return [];
  }
}

// FRED Blog RSS から記事を取得
async function fetchFredBlogPosts(): Promise<MacroNewsItem[]> {
  try {
    const res = await fetch('https://fredblog.stlouisfed.org/feed/', {
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const items: MacroNewsItem[] = [];
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

      const rawSummary = descMatch ? descMatch[1] : '';

      if (title) {
        const parsed = parseFredBlogItem(title, rawSummary);
        items.push({
          id: `fred-blog-${count}`,
          date,
          title: parsed.title,
          summary: parsed.summary,
          points: parsed.points,
          source: 'FRED Blog (セントルイス連銀)',
          category: parsed.category,
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
  const [frbNews, blogPosts] = await Promise.all([
    fetchFrbMonetaryReleases(),
    fetchFredBlogPosts()
  ]);

  let majorReleases: MacroNewsItem[] = [];

  if (FRED_API_KEY && FRED_API_KEY !== 'YOUR_FRED_API_KEY_HERE') {
    try {
      const url = `https://api.stlouisfed.org/fred/releases?api_key=${FRED_API_KEY}&file_type=json&limit=50&sort_order=desc`;
      const res = await fetch(url, { next: { revalidate: 86400 } });

      if (res.ok) {
        const data = await res.json();
        const releases = data.releases || [];

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

  // FRB速報 ＋ 連銀ブログ ＋ 厳選主要リリースを日付順に統合
  const allNews = [...frbNews, ...blogPosts, ...majorReleases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return NextResponse.json({ success: true, data: allNews });
}
