const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export const SERIES_IDS = {
  rates_fx: ['DEXJPUS', 'DTWEXBGS', 'DEXUSEU', 'FEDFUNDS', 'DGS10', 'DGS2', 'T10Y2Y', 'T10Y3M', 'DFII10', 'T10YIE', 'BAMLH0A0HYM2'],
  inflation: ['CPIAUCSL', 'CPILFESL', 'PCEPI', 'PCEPILFE', 'WPSFD49207'],
  employment: ['UNRATE', 'PAYEMS', 'ICSA', 'CCSA', 'JTSJOL'],
  markets: ['SP500', 'NASDAQCOM', 'DCOILWTICO', 'GOLDAMGBD228NLBM'],
  growth_liquidity: ['GDP', 'RSAFS', 'INDPRO', 'HOUST', 'WALCL', 'M2SL', 'UMCSENT']
};

export const ALL_SERIES_IDS = Object.values(SERIES_IDS).flat();

const SERIES_UNITS: Record<string, string> = {
  CPIAUCSL: 'pc1', // 前年比 %
  CPILFESL: 'pc1',
  PCEPI: 'pc1',
  PCEPILFE: 'pc1', // コアPCE 前年比 %
  WPSFD49207: 'pc1',
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
    const url = `${FRED_API_BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=120${units}`;
    
    const res = await fetch(url, {
      next: { revalidate: 86400 }
    });

    if (!res.ok) {
      console.error(`Error fetching ${seriesId} from FRED: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return {
      seriesId,
      observations: data.observations || []
    };
  } catch (error) {
    console.error(`Error fetching ${seriesId}:`, error);
    return null;
  }
}

function generateMockData(seriesId: string): FredSeriesData {
  const observations: Observation[] = [];
  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dateStr = d.toISOString().split('T')[0];
    let val = 0;
    
    if (seriesId === 'DEXJPUS') val = 150.0 + Math.sin(i / 5) * 5 + (Math.random() * 2 - 1); // ドル円 (145-155)
    else if (seriesId === 'DTWEXBGS') val = 120.0 + Math.sin(i / 6) * 3 + (Math.random() * 1.5 - 0.75); // ドルインデックス
    else if (seriesId === 'DEXUSEU') val = 1.08 + Math.sin(i / 4) * 0.04 + (Math.random() * 0.02 - 0.01); // ユーロドル
    else if (seriesId === 'T10Y2Y') val = -0.3 + (i * 0.02) + (Math.random() * 0.2 - 0.1); // 逆イールド (-0.5 ~ +0.5%)
    else if (seriesId === 'T10Y3M') val = -0.5 + (i * 0.015) + (Math.random() * 0.2 - 0.1);
    else if (seriesId === 'DFII10') val = 1.8 + Math.random() * 0.5; // 10年実質金利
    else if (seriesId === 'T10YIE') val = 2.2 + Math.random() * 0.4; // 期待インフレ率
    else if (seriesId === 'BAMLH0A0HYM2') val = 3.5 + Math.random() * 1.2; // HYスプレッド %
    else if (seriesId.includes('CPI') || seriesId === 'PCEPI' || seriesId === 'PCEPILFE' || seriesId === 'WPSFD49207') {
      val = 2.4 + Math.random() * 1.5; // Inflation %
    }
    else if (seriesId === 'UNRATE') val = 3.9 + Math.random() * 0.6; // 失業率 %
    else if (seriesId === 'PAYEMS') val = 158000 + (Math.random() * 300 - i * 150); // 非農業部門雇用者数
    else if (seriesId === 'ICSA') val = 215 + Math.random() * 25; // 新規失業保険 (千件)
    else if (seriesId === 'CCSA') val = 1800 + Math.random() * 100; // 継続受給 (千件)
    else if (seriesId === 'JTSJOL') val = 8000 + Math.random() * 500; // JOLTS (千件)
    else if (seriesId === 'SP500') val = 5200 + Math.sin(i / 3) * 200 + (Math.random() * 50 - 25); // S&P500
    else if (seriesId === 'NASDAQCOM') val = 17500 + Math.sin(i / 3) * 800 + (Math.random() * 100 - 50); // NASDAQ
    else if (seriesId === 'DCOILWTICO') val = 75 + Math.sin(i / 4) * 10 + (Math.random() * 4 - 2); // WTI原油
    else if (seriesId === 'GOLDAMGBD228NLBM') val = 2350 + Math.sin(i / 6) * 150 + (Math.random() * 20 - 10); // 金価格
    else if (seriesId === 'GDP') val = 2.0 + Math.random() * 1.5; // GDP %
    else if (seriesId === 'RSAFS') val = 0.4 + Math.random() * 0.8; // 小売 %
    else if (seriesId === 'WALCL') val = 7200000 - (i * 20000) + (Math.random() * 5000 - 2500); // FRB総資産 (百万ドル)
    else if (seriesId.includes('DGS') || seriesId === 'FEDFUNDS') val = 4.2 + Math.random() * 1.0;
    else if (seriesId === 'M2SL') val = 20800 + (i * 50) + (Math.random() * 50);
    else if (seriesId === 'UMCSENT') val = 68 + Math.random() * 10;
    else val = 100 + Math.random() * 50;

    observations.push({ date: dateStr, value: val.toFixed(2) });
  }

  return {
    seriesId,
    observations: observations.reverse()
  };
}
