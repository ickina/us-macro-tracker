import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全41指標の定義
const SERIES_CONFIG = [
  // 為替・金利・市場スプレッド
  { id: 'DEXJPUS', category: 'rates_fx', freq: 'daily' },
  { id: 'DTWEXBGS', category: 'rates_fx', freq: 'daily' },
  { id: 'DEXUSEU', category: 'rates_fx', freq: 'daily' },
  { id: 'FEDFUNDS', category: 'rates_fx', freq: 'monthly' },
  { id: 'DGS10', category: 'rates_fx', freq: 'daily' },
  { id: 'DGS2', category: 'rates_fx', freq: 'daily' },
  { id: 'T10Y2Y', category: 'rates_fx', freq: 'daily' },
  { id: 'T10Y3M', category: 'rates_fx', freq: 'daily' },
  { id: 'DFII10', category: 'rates_fx', freq: 'daily' },
  { id: 'T10YIE', category: 'rates_fx', freq: 'daily' },
  { id: 'BAMLH0A0HYM2', category: 'rates_fx', freq: 'daily' },

  // インフレ・物価 (前年同月比 pc1)
  { id: 'CPIAUCSL', category: 'inflation', calc: 'yoy', freq: 'monthly' },
  { id: 'CPILFESL', category: 'inflation', calc: 'yoy', freq: 'monthly' },
  { id: 'PCEPI', category: 'inflation', calc: 'yoy', freq: 'monthly' },
  { id: 'PCEPILFE', category: 'inflation', calc: 'yoy', freq: 'monthly' },
  { id: 'WPSFD49207', category: 'inflation', calc: 'yoy', freq: 'monthly' },

  // 雇用
  { id: 'UNRATE', category: 'employment', freq: 'monthly' },
  { id: 'PAYEMS', category: 'employment', freq: 'monthly' },
  { id: 'CES0500000003', category: 'employment', calc: 'yoy', freq: 'monthly' }, // 平均時給 前年比
  { id: 'CIVPART', category: 'employment', freq: 'monthly' },
  { id: 'U6RATE', category: 'employment', freq: 'monthly' },
  { id: 'ICSA', category: 'employment', freq: 'weekly' },
  { id: 'CCSA', category: 'employment', freq: 'weekly' },
  { id: 'JTSJOL', category: 'employment', freq: 'monthly' },

  // 株式・コモディティ・暗号資産
  { id: 'SP500', category: 'markets', freq: 'daily' },
  { id: 'NASDAQCOM', category: 'markets', freq: 'daily' },
  { id: 'DJIA', category: 'markets', freq: 'daily' },
  { id: 'VIXCLS', category: 'markets', freq: 'daily' },
  { id: 'NIKKEI225', category: 'markets', freq: 'daily' },
  { id: 'CBBTCUSD', category: 'markets', freq: 'daily' },
  { id: 'CBETHUSD', category: 'markets', freq: 'daily' },
  { id: 'NASDAQXAU', category: 'markets', freq: 'daily' },
  { id: 'DCOILWTICO', category: 'markets', freq: 'daily' },
  { id: 'DHHNGSP', category: 'markets', freq: 'daily' },

  // 景気・流動性
  { id: 'GDP', category: 'growth_liquidity', calc: 'pca', freq: 'quarterly' }, // 前期比年率
  { id: 'RSAFS', category: 'growth_liquidity', calc: 'pch', freq: 'monthly' }, // 小売売上高 前月比
  { id: 'INDPRO', category: 'growth_liquidity', freq: 'monthly' },
  { id: 'HOUST', category: 'growth_liquidity', freq: 'monthly' },
  { id: 'WALCL', category: 'growth_liquidity', freq: 'weekly' },
  { id: 'M2SL', category: 'growth_liquidity', freq: 'monthly' },
  { id: 'UMCSENT', category: 'growth_liquidity', freq: 'monthly' }
];

function decodeHtmlEntities(str) {
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

async function fetchFredSeries(conf) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${conf.id}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${conf.id}: HTTP ${res.status}`);
  }
  const text = await res.text();
  const lines = text.trim().split('\n');
  const rawObs = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 2) {
      const date = parts[0].trim();
      const val = parts[1].trim();
      if (val && val !== '.') {
        rawObs.push({ date, value: parseFloat(val) });
      }
    }
  }

  let finalObs = [];

  if (conf.calc === 'yoy') {
    // 前年同月比 %
    // 月次ならおおよそ12ヶ月前のレコードを探す
    for (let i = 0; i < rawObs.length; i++) {
      const cur = rawObs[i];
      const curDate = new Date(cur.date);
      const targetYear = curDate.getFullYear() - 1;
      const targetMonth = curDate.getMonth();

      // 1年前の同月を探す
      const prev = rawObs.find(o => {
        const d = new Date(o.date);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      });

      if (prev && prev.value !== 0) {
        const yoy = ((cur.value - prev.value) / Math.abs(prev.value)) * 100;
        finalObs.push({ date: cur.date, value: yoy.toFixed(2) });
      }
    }
  } else if (conf.calc === 'pch') {
    // 前月比 %
    for (let i = 1; i < rawObs.length; i++) {
      const cur = rawObs[i];
      const prev = rawObs[i - 1];
      if (prev.value !== 0) {
        const pch = ((cur.value - prev.value) / Math.abs(prev.value)) * 100;
        finalObs.push({ date: cur.date, value: pch.toFixed(2) });
      }
    }
  } else if (conf.calc === 'pca') {
    // 前期比年率 % (四半期)
    for (let i = 1; i < rawObs.length; i++) {
      const cur = rawObs[i];
      const prev = rawObs[i - 1];
      if (prev.value > 0) {
        const pca = (Math.pow(cur.value / prev.value, 4) - 1) * 100;
        finalObs.push({ date: cur.date, value: pca.toFixed(2) });
      }
    }
  } else {
    // 生値
    finalObs = rawObs.map(o => ({ date: o.date, value: o.value.toString() }));
  }

  // 直近最大300件（日次なら約1年強、月次なら25年分）にスライス
  const limit = conf.freq === 'daily' ? 300 : conf.freq === 'weekly' ? 260 : 120;
  if (finalObs.length > limit) {
    finalObs = finalObs.slice(-limit);
  }

  return {
    seriesId: conf.id,
    observations: finalObs
  };
}

// 為替レートの最新補完
async function supplementLiveFx(indicators) {
  try {
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      const now = new Date();
      const day = now.getDay();
      if (day === 0) now.setDate(now.getDate() - 2);
      else if (day === 6) now.setDate(now.getDate() - 1);
      const pad = n => n.toString().padStart(2, '0');
      const todayDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      if (indicators.DEXJPUS && typeof fxData.rates?.JPY === 'number') {
        const jpy = fxData.rates.JPY;
        const obs = indicators.DEXJPUS.observations;
        const last = obs[obs.length - 1];
        if (last) {
          if (last.date === todayDate) last.value = jpy.toFixed(2);
          else if (last.date < todayDate) obs.push({ date: todayDate, value: jpy.toFixed(2) });
        }
      }

      if (indicators.DEXUSEU && typeof fxData.rates?.EUR === 'number') {
        const eur = 1 / fxData.rates.EUR;
        const obs = indicators.DEXUSEU.observations;
        const last = obs[obs.length - 1];
        if (last) {
          if (last.date === todayDate) last.value = eur.toFixed(4);
          else if (last.date < todayDate) obs.push({ date: todayDate, value: eur.toFixed(4) });
        }
      }
    }
  } catch (err) {
    console.warn('Live FX supplement skipped:', err.message);
  }
}

// FRB公式 Monetary Policy RSS からの取得
async function fetchFrbNews() {
  try {
    const res = await fetch('https://www.federalreserve.gov/feeds/press_monetary.xml');
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 8) {
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
          title = '【FOMC速報】FRB政策金利発表＆パウエル議長記者会見';
          summary = 'FOMC（連邦公開市場委員会）は政策金利（FF金利）の誘導目標方針を公表しました。物価安定と雇用の最大化に向けた政策スタンスが示されています。';
          points = [
            '【金利方針】政策金利誘導目標の決定と声明文の公表',
            '【経済評価】足元のインフレ動向・雇用情勢に関するFRBの公式見解',
            '【今後の見通し】経済指標次第での柔軟な金融引き締め・緩和スタンス'
          ];
        } else if (tLower.includes('economic projections')) {
          title = '【経済・金利見通し】FOMC参加者による最新予測（SEP / ドットチャート）';
          summary = 'FOMC参加者による実質GDP成長率、失業率、PCEインフレ率、および将来の政策金利予測（ドットプロット）が公表されました。';
          points = [
            '【ドットチャート】年内および来期に向けた政策金利の想定着地点',
            '【経済予測】実質GDP成長率およびインフレ率（PCE）の最新改定見通し',
            '【中立金利】長期的な金利水準に対する連銀当局者の最新スタンス'
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
    console.warn('FRB RSS fetch failed:', err.message);
    return [];
  }
}

// FRED Blog RSS からの取得
async function fetchFredBlog() {
  try {
    const res = await fetch('https://fredblog.stlouisfed.org/feed/');
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 8) {
      const content = match[1];
      const titleMatch = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || content.match(/<title>(.*?)<\/title>/);
      const linkMatch = content.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = content.match(/<pubDate>(.*?)<\/pubDate>/);
      const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);

      const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';
      const link = linkMatch ? decodeHtmlEntities(linkMatch[1].trim()) : 'https://fredblog.stlouisfed.org';
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';

      let date = new Date().toISOString().split('T')[0];
      if (pubDateStr) {
        const d = new Date(pubDateStr);
        if (!isNaN(d.getTime())) date = d.toISOString().split('T')[0];
      }

      const rawDesc = descMatch ? decodeHtmlEntities(descMatch[1]) : '';
      const snippet = rawDesc.length > 10 ? rawDesc.slice(0, 130) + '…' : 'セントルイス連銀エコノミストによるマクロ経済データ分析コラムです。';

      if (rawTitle) {
        items.push({
          id: `fred-blog-${count}`,
          date,
          title: `【連銀エコノミスト解説】${rawTitle}`,
          summary: snippet,
          points: [
            `【分析対象】「${rawTitle}」に関する連銀エコノミストの独自分析`,
            '【データ活用】FRED時系列データを活用した構造的変化の考察',
            '【マクロへの影響】景気サイクル・金融市場への長期的な示唆'
          ],
          source: 'FRED Blog (セントルイス連銀)',
          category: rawTitle.toLowerCase().includes('inflation') || rawTitle.toLowerCase().includes('price') ? 'inflation' : rawTitle.toLowerCase().includes('employment') || rawTitle.toLowerCase().includes('job') ? 'employment' : 'growth',
          impact: 'Medium',
          link,
          badge: '連銀マクロコラム'
        });
        count++;
      }
    }
    return items;
  } catch (err) {
    console.warn('FRED Blog fetch failed:', err.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting official macro data fetch from FRED public endpoints...');
  const indicators = {};

  for (const conf of SERIES_CONFIG) {
    try {
      const data = await fetchFredSeries(conf);
      indicators[conf.id] = data;
      const lastObs = data.observations[data.observations.length - 1];
      console.log(`✅ ${conf.id.padEnd(14)}: ${lastObs?.date} -> ${lastObs?.value}`);
    } catch (err) {
      console.error(`❌ ${conf.id}:`, err.message);
    }
  }

  // リアルタイム為替レート合成
  await supplementLiveFx(indicators);

  // マクロニュース取得
  console.log('📰 Fetching latest macroeconomic news...');
  const [frbNews, blogNews] = await Promise.all([fetchFrbNews(), fetchFredBlog()]);
  const allNews = [...frbNews, ...blogNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // JSONファイルとして書き出し
  const outDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    indicators,
    news: allNews
  };

  const outPath = path.join(outDir, 'macroData.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`🎉 Successfully saved official data to ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error during macro data fetch:', err);
  process.exit(1);
});
