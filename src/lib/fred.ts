const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export const SERIES_IDS = {
  rates_fx: ['DEXJPUS', 'DTWEXBGS', 'DEXUSEU', 'FEDFUNDS', 'DGS10', 'DGS2', 'T10Y2Y', 'T10Y3M', 'DFII10', 'T10YIE', 'BAMLH0A0HYM2'],
  inflation: ['CPIAUCSL', 'CPILFESL', 'PCEPI', 'PCEPILFE', 'WPSFD49207'],
  employment: ['UNRATE', 'PAYEMS', 'CES0500000003', 'CIVPART', 'U6RATE', 'ICSA', 'CCSA', 'JTSJOL'],
  markets: ['SP500', 'NASDAQCOM', 'DJIA', 'VIXCLS', 'NIKKEI225', 'CBBTCUSD', 'CBETHUSD', 'NASDAQXAU', 'DCOILWTICO', 'DHHNGSP'],
  growth_liquidity: ['GDP', 'RSAFS', 'INDPRO', 'HOUST', 'WALCL', 'M2SL', 'UMCSENT']
};

export const ALL_SERIES_IDS = Object.values(SERIES_IDS).flat();

const DAILY_SERIES = new Set([
  'DEXJPUS', 'DTWEXBGS', 'DEXUSEU', 'DGS10', 'DGS2', 'T10Y2Y', 'T10Y3M', 'DFII10', 
  'T10YIE', 'BAMLH0A0HYM2', 'SP500', 'NASDAQCOM', 'DJIA', 'VIXCLS', 'NIKKEI225', 
  'CBBTCUSD', 'CBETHUSD', 'DCOILWTICO', 'NASDAQXAU', 'DHHNGSP'
]);

const WEEKLY_SERIES = new Set(['ICSA', 'CCSA', 'WALCL']);

const SERIES_UNITS: Record<string, string> = {
  CPIAUCSL: 'pc1', // 前年比 %
  CPILFESL: 'pc1',
  PCEPI: 'pc1',
  PCEPILFE: 'pc1', // コアPCE 前年比 %
  WPSFD49207: 'pc1',
  CES0500000003: 'pc1', // 平均時給 前年比 %
  GDP: 'pca', // 前期比年率 %
  RSAFS: 'pch', // 前月比 %
};

export interface Observation {
  date: string;
  value: string;
}

export interface FredSeriesData {
  seriesId: string;
  observations: Observation[];
}

export async function fetchSeriesData(seriesId: string): Promise<FredSeriesData | null> {
  if (!FRED_API_KEY || FRED_API_KEY === 'YOUR_FRED_API_KEY_HERE') {
    return generateMockData(seriesId);
  }

  try {
    const units = SERIES_UNITS[seriesId] ? `&units=${SERIES_UNITS[seriesId]}` : '';
    // 日次は約10年分(2500件)、週次は10年分(520件)、月次・四半期は10年分(120件)
    const limit = DAILY_SERIES.has(seriesId) ? 2500 : WEEKLY_SERIES.has(seriesId) ? 520 : 120;
    const url = `${FRED_API_BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}${units}`;
    
    const res = await fetch(url, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.warn(`FRED API returned status ${res.status} for ${seriesId}, using fallback mock data.`);
      return generateMockData(seriesId);
    }

    const data = await res.json();
    if (!data.observations || data.observations.length === 0) {
      console.warn(`No observations for ${seriesId} from FRED, using fallback mock data.`);
      return generateMockData(seriesId);
    }

    const obs = data.observations;

    // 為替（DEXJPUS: ドル円, DEXUSEU: ユーロドル）のリアルタイム最新補完
    const ENABLE_REALTIME_FX_SUPPLEMENT = true;

    if (ENABLE_REALTIME_FX_SUPPLEMENT && (seriesId === 'DEXJPUS' || seriesId === 'DEXUSEU')) {
      try {
        const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', { 
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(2500)
        });

        if (fxRes.ok) {
          const fxData = await fxRes.json();
          const todayDate = new Date().toISOString().split('T')[0];
          const latestObsDate = obs.length > 0 ? obs[0].date : '';

          if (latestObsDate && latestObsDate < todayDate) {
            let currentVal = '';
            
            if (seriesId === 'DEXJPUS' && typeof fxData.rates?.JPY === 'number') {
              const jpy = fxData.rates.JPY;
              if (jpy >= 80 && jpy <= 250) {
                currentVal = jpy.toFixed(2);
              }
            } else if (seriesId === 'DEXUSEU' && typeof fxData.rates?.EUR === 'number') {
              const eurRate = 1 / fxData.rates.EUR;
              if (eurRate >= 0.5 && eurRate <= 2.0) {
                currentVal = eurRate.toFixed(4);
              }
            }

            if (currentVal) {
              obs.unshift({ date: todayDate, value: currentVal });
            }
          }
        }
      } catch (fxErr) {
        console.warn('Real-time FX supplement bypassed, safely falling back to pure FRED data.');
      }
    }

    return {
      seriesId,
      observations: obs
    };
  } catch (error) {
    console.error(`Error fetching ${seriesId}, falling back to mock:`, error);
    return generateMockData(seriesId);
  }
}

function generateMockData(seriesId: string): FredSeriesData {
  const observations: Observation[] = [];
  const now = new Date('2026-10-05T00:00:00Z');
  const isDaily = DAILY_SERIES.has(seriesId);
  const count = isDaily ? 240 : 60; // 日次は240営業日分、月次は60ヶ月分

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    if (isDaily) {
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
    } else {
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
    }
    const dateStr = d.toISOString().split('T')[0];
    let val = 0;
    
    // 滑らかな連続トレンド波形（ホワイトノイズの完全排除）
    if (seriesId === 'DEXJPUS') {
      val = 155.0 + Math.sin(i / 20) * 4.5 + Math.cos(i / 8) * 1.2 + (Math.sin(i * 1.7) * 0.3);
    }
    else if (seriesId === 'DTWEXBGS') {
      val = 120.0 + Math.sin(i / 25) * 3.0 + Math.cos(i / 10) * 0.8;
    }
    else if (seriesId === 'DEXUSEU') {
      val = 1.11 - Math.sin(i / 20) * 0.03 + (Math.sin(i * 1.5) * 0.005);
    }
    else if (seriesId === 'DGS10') {
      // 10年国債利回り: 滑らかなトレンド (4.1%〜4.4%)
      val = 4.25 + Math.sin(i / 22) * 0.25 + Math.cos(i / 11) * 0.12 + (Math.sin(i * 1.4) * 0.03);
    }
    else if (seriesId === 'DGS2') {
      // 2年国債利回り: 滑らかなトレンド (3.9%〜4.3%)
      val = 4.10 + Math.sin(i / 20) * 0.30 + Math.cos(i / 9) * 0.15 + (Math.sin(i * 1.3) * 0.03);
    }
    else if (seriesId === 'DFII10') {
      // 10年実質金利 TIPS: 滑らかなトレンド (1.7%〜2.0%)
      val = 1.92 + Math.sin(i / 25) * 0.15 + Math.cos(i / 12) * 0.08 + (Math.sin(i * 1.5) * 0.02);
    }
    else if (seriesId === 'T10YIE') {
      // 10年期待インフレ率: (2.2%〜2.4%)
      val = 2.35 + Math.sin(i / 30) * 0.10 + (Math.sin(i * 1.2) * 0.02);
    }
    else if (seriesId === 'T10Y2Y') {
      // 10年-2年金利差
      val = 0.45 - (i * 0.004) + Math.sin(i / 15) * 0.15;
    }
    else if (seriesId === 'T10Y3M') {
      // 10年-3ヶ月金利差
      val = -0.28 + (i * 0.003) + Math.sin(i / 18) * 0.12;
    }
    else if (seriesId === 'FEDFUNDS') {
      // FF金利
      val = i < 15 ? 3.75 : i < 70 ? 3.50 : 3.25;
    }
    else if (seriesId === 'BAMLH0A0HYM2') {
      // ハイイールドスプレッド
      val = 3.24 + Math.sin(i / 20) * 0.35 + Math.cos(i / 9) * 0.18 + (Math.sin(i * 1.6) * 0.04);
    }
    else if (seriesId.includes('CPI') || seriesId === 'PCEPI' || seriesId === 'PCEPILFE' || seriesId === 'WPSFD49207') {
      val = 2.5 + Math.sin(i / 10) * 0.4 + (i * 0.02);
    }
    else if (seriesId === 'UNRATE') {
      // 2026年9月=4.2%, 8月=4.1%, 7月=4.3%
      val = i === 0 ? 4.2 : i === 1 ? 4.1 : 4.1 + Math.sin(i / 8) * 0.2;
    }
    else if (seriesId === 'PAYEMS') {
      val = 159104 - (i * 120) + Math.sin(i / 5) * 200;
    }
    else if (seriesId === 'CES0500000003') {
      val = i === 0 ? 3.0 : 3.2 + Math.sin(i / 6) * 0.3;
    }
    else if (seriesId === 'CIVPART') {
      val = 62.7 + Math.sin(i / 10) * 0.15;
    }
    else if (seriesId === 'U6RATE') {
      val = 7.9 + Math.sin(i / 8) * 0.3;
    }
    else if (seriesId === 'ICSA') {
      val = 215 + Math.sin(i / 8) * 12 + (Math.sin(i * 1.5) * 4);
    }
    else if (seriesId === 'CCSA') {
      val = 1750 + Math.sin(i / 10) * 50;
    }
    else if (seriesId === 'JTSJOL') {
      val = 7600 - (i * 15) + Math.sin(i / 8) * 200;
    }
    else if (seriesId === 'SP500') {
      val = 5750 + Math.sin(i / 15) * 220 + Math.cos(i / 8) * 80 + (Math.sin(i * 1.8) * 15);
    }
    else if (seriesId === 'NASDAQCOM') {
      val = 18200 + Math.sin(i / 14) * 900 + Math.cos(i / 7) * 350 + (Math.sin(i * 1.7) * 40);
    }
    else if (seriesId === 'DJIA') {
      val = 42200 + Math.sin(i / 16) * 1100 + Math.cos(i / 8) * 400 + (Math.sin(i * 1.6) * 60);
    }
    else if (seriesId === 'VIXCLS') {
      val = 15.5 + Math.sin(i / 10) * 3.5 + Math.abs(Math.sin(i * 1.4) * 2.0);
    }
    else if (seriesId === 'NIKKEI225') {
      val = 39200 + Math.sin(i / 15) * 1400 + Math.cos(i / 7) * 500;
    }
    else if (seriesId === 'CBBTCUSD') {
      val = 64500 + Math.sin(i / 12) * 6500 + Math.cos(i / 6) * 2500;
    }
    else if (seriesId === 'CBETHUSD') {
      val = 2650 + Math.sin(i / 12) * 350 + Math.cos(i / 6) * 120;
    }
    else if (seriesId === 'DCOILWTICO') {
      val = 73.5 + Math.sin(i / 14) * 6.5 + Math.cos(i / 7) * 2.5;
    }
    else if (seriesId === 'NASDAQXAU') {
      val = 160 + Math.sin(i / 15) * 18 + Math.cos(i / 8) * 6;
    }
    else if (seriesId === 'DHHNGSP') {
      val = 2.85 + Math.sin(i / 12) * 0.45 + (Math.sin(i * 1.5) * 0.1);
    }
    else if (seriesId === 'GDP') {
      val = 2.8 + Math.sin(i / 4) * 0.5;
    }
    else if (seriesId === 'RSAFS') {
      val = 0.35 + Math.sin(i / 5) * 0.4;
    }
    else if (seriesId === 'WALCL') {
      val = 7100000 - (i * 8000) + Math.sin(i / 8) * 15000;
    }
    else if (seriesId === 'M2SL') {
      val = 21100 + (i * 40) + Math.sin(i / 6) * 80;
    }
    else if (seriesId === 'UMCSENT') {
      val = 70.5 + Math.sin(i / 8) * 5.0;
    }
    else {
      val = 100 + Math.sin(i / 10) * 10;
    }

    observations.push({ date: dateStr, value: val.toFixed(2) });
  }

  return {
    seriesId,
    observations: observations.reverse()
  };
}
