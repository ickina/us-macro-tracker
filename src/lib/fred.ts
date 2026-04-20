const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export const SERIES_IDS = {
  inflation: ['CPIAUCSL', 'CPILFESL', 'PCE', 'WPSFD49207'],
  employment: ['UNRATE', 'PAYEMS', 'ICSA', 'JTSJOL'],
  growth: ['GDP', 'RSAFS', 'HOUST', 'INDPRO'],
  rates: ['FEDFUNDS', 'DGS10', 'DGS2', 'M2SL'],
  sentiment: ['UMCSENT']
};

export const ALL_SERIES_IDS = Object.values(SERIES_IDS).flat();

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
    const url = `${FRED_API_BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=120`;
    
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
    
    if (seriesId.includes('CPI') || seriesId === 'PCE') val = 300 + Math.random() * 20;
    else if (seriesId === 'UNRATE') val = 3.5 + Math.random() * 1.5;
    else if (seriesId === 'PAYEMS') val = 150000 + (Math.random() * 5000 - i * 100);
    else if (seriesId === 'GDP') val = 25000 + Math.random() * 1000;
    else if (seriesId.includes('DGS') || seriesId === 'FEDFUNDS') val = 4 + Math.random() * 2;
    else val = 100 + Math.random() * 50;

    observations.push({ date: dateStr, value: val.toFixed(2) });
  }

  return {
    seriesId,
    observations: observations.reverse()
  };
}
