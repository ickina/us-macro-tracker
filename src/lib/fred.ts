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

    // 為替（DEXJPUS: ドル円, DEXUSEU: ユーロドル）のリアルタイム最新補完（安全対策付き）
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
    
    if (seriesId === 'DEXJPUS') val = 150.0 + Math.sin(i / 15) * 5 + (Math.random() * 2 - 1);
    else if (seriesId === 'DTWEXBGS') val = 120.0 + Math.sin(i / 20) * 3 + (Math.random() * 1.5 - 0.75);
    else if (seriesId === 'DEXUSEU') val = 1.08 + Math.sin(i / 15) * 0.04 + (Math.random() * 0.02 - 0.01);
    else if (seriesId === 'T10Y2Y') val = -0.15 + (i * 0.005) + (Math.random() * 0.1 - 0.05);
    else if (seriesId === 'T10Y3M') val = -0.3 + (i * 0.004) + (Math.random() * 0.1 - 0.05);
    else if (seriesId === 'DFII10') val = 1.8 + Math.random() * 0.5;
    else if (seriesId === 'T10YIE') val = 2.2 + Math.random() * 0.4;
    else if (seriesId === 'BAMLH0A0HYM2') val = 3.5 + Math.random() * 1.2;
    else if (seriesId.includes('CPI') || seriesId === 'PCEPI' || seriesId === 'PCEPILFE' || seriesId === 'WPSFD49207') {
      val = 2.5 + Math.random() * 0.5;
    }
    else if (seriesId === 'UNRATE') {
      // 2026年9月=4.2%, 8月=4.1%, 7月=4.3%
      val = i === 0 ? 4.2 : i === 1 ? 4.1 : 4.2 + (Math.random() * 0.4 - 0.2);
    }
    else if (seriesId === 'PAYEMS') {
      // 2026年9月=159,104 (2.9万人増), 8月=159,075 (13.3万人増)
      val = 159104 - (i * 100);
    }
    else if (seriesId === 'CES0500000003') {
      // 平均時給 前年比: 3.0% (9月), 3.8% (8月)
      val = i === 0 ? 3.0 : 3.5 + (Math.random() * 0.4 - 0.2);
    }
    else if (seriesId === 'CIVPART') {
      // 労働参加率: 62.7%
      val = i === 0 ? 62.7 : 62.6 + (Math.random() * 0.2 - 0.1);
    }
    else if (seriesId === 'U6RATE') {
      // U-6失業率: 7.9%
      val = i === 0 ? 7.9 : 7.8 + (Math.random() * 0.3 - 0.15);
    }
    else if (seriesId === 'ICSA') val = 215 + Math.random() * 25;
    else if (seriesId === 'CCSA') val = 1800 + Math.random() * 100;
    else if (seriesId === 'JTSJOL') val = 7500 + Math.random() * 500;
    else if (seriesId === 'SP500') val = 5600 + Math.sin(i / 10) * 200 + (Math.random() * 30 - 15);
    else if (seriesId === 'NASDAQCOM') val = 18000 + Math.sin(i / 10) * 800 + (Math.random() * 80 - 40);
    else if (seriesId === 'DJIA') val = 41500 + Math.sin(i / 12) * 1200 + (Math.random() * 100 - 50);
    else if (seriesId === 'VIXCLS') val = 16.5 + Math.sin(i / 6) * 4 + (Math.random() * 2 - 1);
    else if (seriesId === 'NIKKEI225') val = 39000 + Math.sin(i / 10) * 1500 + (Math.random() * 150 - 75);
    else if (seriesId === 'CBBTCUSD') val = 64000 + Math.sin(i / 8) * 8000 + (Math.random() * 1000 - 500);
    else if (seriesId === 'CBETHUSD') val = 2600 + Math.sin(i / 8) * 400 + (Math.random() * 80 - 40);
    else if (seriesId === 'DCOILWTICO') val = 74 + Math.sin(i / 12) * 10 + (Math.random() * 3 - 1.5);
    else if (seriesId === 'NASDAQXAU') val = 155 + Math.sin(i / 12) * 20 + (Math.random() * 3 - 1.5);
    else if (seriesId === 'DHHNGSP') val = 2.8 + Math.sin(i / 10) * 0.6 + (Math.random() * 0.2 - 0.1);
    else if (seriesId === 'GDP') val = 2.8 + Math.random() * 0.5;
    else if (seriesId === 'RSAFS') val = 0.3 + Math.random() * 0.6;
    else if (seriesId === 'WALCL') val = 7100000 - (i * 10000) + (Math.random() * 5000 - 2500);
    else if (seriesId.includes('DGS') || seriesId === 'FEDFUNDS') val = 3.9 + Math.random() * 0.5;
    else if (seriesId === 'M2SL') val = 21000 + (i * 50) + (Math.random() * 50);
    else if (seriesId === 'UMCSENT') val = 70 + Math.random() * 8;
    else val = 100 + Math.random() * 50;

    observations.push({ date: dateStr, value: val.toFixed(2) });
  }

  return {
    seriesId,
    observations: observations.reverse()
  };
}
