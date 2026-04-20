const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export const SERIES_IDS = {
  inflation: ['CPIAUCSL', 'CPILFESL', 'PCEPI', 'WPSFD49207'],
  employment: ['UNRATE', 'PAYEMS', 'ICSA', 'JTSJOL'],
  growth: ['GDP', 'RSAFS', 'HOUST', 'INDPRO'],
  rates: ['FEDFUNDS', 'DGS10', 'DGS2', 'M2SL'],
  sentiment: ['UMCSENT']
};

export const ALL_SERIES_IDS = Object.values(SERIES_IDS).flat();

const SERIES_UNITS: Record<string, string> = {
  CPIAUCSL: 'pc1', // 前年比 %
  CPILFESL: 'pc1',
  PCEPI: 'pc1',
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
    
    if (seriesId.includes('CPI') || seriesId === 'PCEPI' || seriesId === 'WPSFD49207') val = 2.0 + Math.random() * 2.0; // Inflation %
    else if (seriesId === 'UNRATE') val = 3.5 + Math.random() * 1.5;
    else if (seriesId === 'PAYEMS') val = 150000 + (Math.random() * 5000 - i * 100);
    else if (seriesId === 'GDP') val = 1.5 + Math.random() * 2.5; // GDP Growth %
    else if (seriesId === 'RSAFS') val = 0.5 + Math.random() * 1.0; // Retail MoM %
    else if (seriesId.includes('DGS') || seriesId === 'FEDFUNDS') val = 4 + Math.random() * 2;
    else val = 100 + Math.random() * 50;

    observations.push({ date: dateStr, value: val.toFixed(2) });
  }

  return {
    seriesId,
    observations: observations.reverse()
  };
}
