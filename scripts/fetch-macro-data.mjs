import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全41指標の定義
export const SERIES_CONFIG = [
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

// Bound stalled remote requests; preserve TLS verification and the inherited network setup.
async function request(url, options = {}) {
  return fetch(url, { ...options, signal: options.signal ?? AbortSignal.timeout(15000) });
}

export function validateSeries(data, id) {
  if (data?.seriesId !== id || !Array.isArray(data.observations) || data.observations.length === 0) {
    throw new Error(`${id}: no usable observations`);
  }
  let previousDate = '';
  for (const { date, value } of data.observations) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date || date <= previousDate ||
        typeof value !== 'string' || value.trim() === '' || !Number.isFinite(Number(value))) {
      throw new Error(`${id}: invalid or unordered observation`);
    }
    previousDate = date;
  }
}

function warning(message) {
  console.warn(`Warning: ${message}`);
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.warn(`::warning::${message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')}`);
  }
}

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

export async function fetchFredSeries(conf) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${conf.id}`;
  const res = await request(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${conf.id}: HTTP ${res.status}`);
  }
  const text = await res.text();
  const lines = text.trim().split('\n');
  const header = lines[0].replace(/^\uFEFF/, '').trim().split(',');
  if (!['DATE', 'observation_date'].includes(header[0]) || header[1] !== conf.id) {
    throw new Error(`${conf.id}: unexpected CSV response`);
  }
  const rawObs = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length !== 2) throw new Error(`${conf.id}: malformed CSV row`);
    if (parts.length === 2) {
      const date = parts[0].trim();
      const val = parts[1].trim();
      if (val && val !== '.') {
        if (!Number.isFinite(Number(val))) throw new Error(`${conf.id}: non-numeric CSV value`);
        rawObs.push({ date, value: Number(val) });
      }
    }
  }

  validateSeries({ seriesId: conf.id, observations: rawObs.map(o => ({ ...o, value: String(o.value) })) }, conf.id);

  let finalObs = [];

  if (conf.calc === 'yoy') {
    for (let i = 0; i < rawObs.length; i++) {
      const cur = rawObs[i];
      const curDate = new Date(cur.date);
      const targetYear = curDate.getFullYear() - 1;
      const targetMonth = curDate.getMonth();

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
    for (let i = 1; i < rawObs.length; i++) {
      const cur = rawObs[i];
      const prev = rawObs[i - 1];
      if (prev.value !== 0) {
        const pch = ((cur.value - prev.value) / Math.abs(prev.value)) * 100;
        finalObs.push({ date: cur.date, value: pch.toFixed(2) });
      }
    }
  } else if (conf.calc === 'pca') {
    for (let i = 1; i < rawObs.length; i++) {
      const cur = rawObs[i];
      const prev = rawObs[i - 1];
      if (prev.value > 0) {
        const pca = (Math.pow(cur.value / prev.value, 4) - 1) * 100;
        finalObs.push({ date: cur.date, value: pca.toFixed(2) });
      }
    }
  } else {
    finalObs = rawObs.map(o => ({ date: o.date, value: o.value.toString() }));
  }

  const limit = conf.freq === 'daily' ? 300 : conf.freq === 'weekly' ? 260 : 120;
  if (finalObs.length > limit) {
    finalObs = finalObs.slice(-limit);
  }

  const result = { seriesId: conf.id, observations: finalObs };
  validateSeries(result, conf.id);
  return result;
}

// 為替レートの最新補完
async function supplementLiveFx(indicators) {
  try {
    const fxRes = await request('https://open.er-api.com/v6/latest/USD');
    if (!fxRes.ok) throw new Error(`HTTP ${fxRes.status}`);
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      if (![fxData.rates?.JPY, fxData.rates?.EUR].every(v => typeof v === 'number' && Number.isFinite(v) && v > 0)) throw new Error('Invalid FX response');
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
    warning(`Live FX supplement skipped; FRED values retained: ${err.message}`);
  }
}

// FRB公式 Monetary Policy RSS からの取得
async function fetchFrbNews() {
  try {
    const res = await request('https://www.federalreserve.gov/feeds/press_monetary.xml');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = [];
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
        } else if (tLower.includes('minutes') && tLower.includes('open market committee')) {
          title = '【FOMC議事要旨】連邦公開市場委員会 議事要旨の公表';
          summary = '前回のFOMC会合における政策金利判断の議論詳細が公表されました。インフレ見通しや労働市場の評価、金融引き締めの継続期間に関する連銀幹部の議論が記録されています。';
          points = [
            '【議論内容】金融政策運営方針と参加者ごとの景気・物価認識の詳細',
            '【インフレ警戒】エネルギー価格やサービスインフレに対する政策委員の評価',
            '【先行きの舵取り】経済指標に応じた今後の金利調整スタンス'
          ];
        } else if (tLower.includes('discount rate')) {
          title = '【FRB議事録】連銀公定歩合会合 議事録の公表';
          summary = '各地区連銀総裁からの公定歩合（割引率）要請と理事会での審議結果が公表されました。地域経済の温度差や信用状況が反映されています。';
          points = [
            '【各地区連銀の要請】全米各地域の景況感と金利要請スタンス',
            '【信用動向】金融機関の資金調達動向と流動性環境の確認',
            '【政策波及】本会合に向けた地区ごとの経済見通しの差異'
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
    if (items.length === 0) throw new Error('No usable news items');
    return items;
  } catch (err) {
    throw new Error(`FRB RSS fetch failed: ${err.message}`);
  }
}

// CNBC公式公開マーケットRSSからの市場速報取得（二重安全ネット付き）
async function fetchCnbcMarketNews() {
  try {
    const rssUrl = 'https://www.cnbc.com/id/100003114/device/rss/rss.html';
    const res = await request(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    const items = [];
    const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>/g;
    let m;
    const marketRegex = /\b(oil|crude|gas|energy|yield|treasury|bond|stock|dow|s&p|nasdaq|market|inflation|cpi|pce|fed|rate|hike|cut|interest|ai|tech|semiconductor|chip|nvidia|alphabet|google|apple|amazon|microsoft|earnings|capex|job|payroll|unemployment|gdp|economy|dollar)\b/i;

    async function translateText(text) {
      if (!text) return '';
      try {
        const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=' + encodeURIComponent(text);
        const r = await request(url, { signal: AbortSignal.timeout(3000) });
        if (!r.ok) return '';
        const d = await r.json();
        return d[0][0][0] || '';
      } catch {
        return '';
      }
    }

    let count = 0;
    while ((m = regex.exec(xml)) !== null && count < 3) {
      const rawTitle = m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      const rawDesc = m[2].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      const link = m[3].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      const pubDateStr = m[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();

      const combinedText = `${rawTitle} ${rawDesc}`.toLowerCase();
      if (!marketRegex.test(combinedText)) {
        continue;
      }

      let date = new Date().toISOString().split('T')[0];
      if (pubDateStr) {
        const d = new Date(pubDateStr);
        if (!isNaN(d.getTime())) date = d.toISOString().split('T')[0];
      }

      const jaTitle = await translateText(rawTitle);
      const jaDesc = (await translateText(rawDesc)) || jaTitle;
      if (!jaTitle) continue;

      let category = 'market';
      let points = [
        '【市場動向】ウォール街における最新の市場センチメントと価格変動',
        '【背景要因】マクロ経済動向および主要セクターの需給バランス',
        '【市場への影響】投資家のリスク姿勢や今後の資産価格への波及'
      ];
      let badge = 'NY市場速報';

      if (combinedText.includes('oil') || combinedText.includes('crude') || combinedText.includes('gas') || combinedText.includes('energy')) {
        category = 'growth';
        badge = '原油・エネルギー';
        points = [
          '【原油価格動向】地政学リスクや需給バランスの変化を受けたエネルギー価格の急変動',
          '【インフレへの影響】ガソリン・物流コスト上昇に伴う物価粘着性と金融引き締め懸念',
          '【株式市場への波及】エネルギー株と一般消費財・ハイテク株の間での資金シフト'
        ];
      } else if (combinedText.includes('ai') || combinedText.includes('chip') || combinedText.includes('semiconductor') || combinedText.includes('tech') || combinedText.includes('nvidia')) {
        category = 'growth';
        badge = 'AIテック動向';
        points = [
          '【テクノロジー動向】AIインフラ投資・データセンター需要と技術開発の進展状況',
          '【巨額CapEx負担】メガテック各社の大規模AI設備投資と短期的な投資回収効率への視線',
          '【市場の反応】半導体・ハイテク大手銘柄ごとの株価ボラティリティと業績選別'
        ];
      } else if (combinedText.includes('yield') || combinedText.includes('treasury') || combinedText.includes('bond') || combinedText.includes('fed') || combinedText.includes('rate') || combinedText.includes('inflation')) {
        category = 'inflation';
        badge = '金利・インフレ';
        points = [
          '【長期金利の反応】米国債利回りの高止まりと為替相場（ドル高・ドル安）への直接的影響',
          '【FRB政策見通し】経済指標を受けた金融政策（利下げ・利上げ）の市場織り込み',
          '【バリュエーション】借入コストの上昇が株式市場全体の株価収益率（PER）に与える下押し圧力'
        ];
      }

      items.push({
        id: `cnbc-market-${count}`,
        date,
        title: `【NY市場速報】${jaTitle}`,
        summary: jaDesc,
        points,
        source: 'CNBC US Market',
        category,
        impact: 'High',
        link,
        badge
      });
      count++;
    }
    if (items.length === 0) throw new Error('No usable news items');
    return items;
  } catch (err) {
    throw new Error(`CNBC market news fetch failed: ${err.message}`);
  }
}

export async function main({ outPath = path.join(__dirname, '..', 'src', 'data', 'macroData.json') } = {}) {
  // Load before fetching: an unreadable existing snapshot must never be silently replaced.
  const previous = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : null;
  const indicators = {};
  const failures = [];
  console.log('Starting macro data refresh (41 required indicators)...');
  for (const conf of SERIES_CONFIG) {
    try {
      indicators[conf.id] = await fetchFredSeries(conf);
      console.log(`OK ${conf.id}`);
    } catch (err) {
      failures.push(`${conf.id}: ${err.message}`);
      console.error(`FAILED ${conf.id}: ${err.message}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`Refresh cancelled; existing data and updatedAt unchanged. ${failures.length} indicator(s) failed: ${failures.join('; ')}`);
  }

  await supplementLiveFx(indicators);
  for (const conf of SERIES_CONFIG) validateSeries(indicators[conf.id], conf.id);

  const news = [];
  const newsSources = [
    { source: 'CNBC US Market', fetchNews: fetchCnbcMarketNews },
    { source: 'Federal Reserve Board (FRB)', fetchNews: fetchFrbNews }
  ];
  for (const { source, fetchNews } of newsSources) {
    try {
      news.push(...await fetchNews());
    } catch (err) {
      const retained = (previous?.news ?? []).filter(item => item.source === source);
      news.push(...retained);
      warning(`${source}: ${err.message}; retained ${retained.length} previous news item(s).`);
    }
  }

  const payload = { updatedAt: new Date().toISOString(), indicators, news };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  // Rename on the same filesystem so an interrupted write cannot truncate the live snapshot.
  const temporaryPath = `${outPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(payload, null, 2), { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(temporaryPath, outPath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
  console.log(`Saved ${SERIES_CONFIG.length} indicators and ${news.length} news items to ${outPath}`);
  return payload;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(err => {
    console.error('Fatal refresh error:', err.message);
    process.exitCode = 1;
  });
}
