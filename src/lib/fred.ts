import macroData from '@/data/macroData.json';

export const SERIES_IDS = {
  rates_fx: ['DEXJPUS', 'DTWEXBGS', 'DEXUSEU', 'FEDFUNDS', 'DGS10', 'DGS2', 'T10Y2Y', 'T10Y3M', 'DFII10', 'T10YIE', 'BAMLH0A0HYM2'],
  inflation: ['CPIAUCSL', 'CPILFESL', 'PCEPI', 'PCEPILFE', 'WPSFD49207'],
  employment: ['UNRATE', 'PAYEMS', 'CES0500000003', 'CIVPART', 'U6RATE', 'ICSA', 'CCSA', 'JTSJOL'],
  markets: ['SP500', 'NASDAQCOM', 'DJIA', 'VIXCLS', 'NIKKEI225', 'CBBTCUSD', 'CBETHUSD', 'NASDAQXAU', 'DCOILWTICO', 'DHHNGSP'],
  growth_liquidity: ['GDP', 'RSAFS', 'INDPRO', 'HOUST', 'WALCL', 'M2SL', 'UMCSENT']
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
  // 1. 公式データセット (macroData.json) から取得
  const indicators = (macroData as any).indicators || {};
  if (indicators[seriesId]) {
    return indicators[seriesId];
  }

  // 2. 万が一未収録の場合は公式公開CSVから直接オンデマンド取得
  try {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n');
      const obs: Observation[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 2) {
          const date = parts[0].trim();
          const val = parts[1].trim();
          if (val && val !== '.') {
            obs.push({ date, value: val });
          }
        }
      }
      return {
        seriesId,
        observations: obs.slice(-300)
      };
    }
  } catch (err) {
    console.error(`Error fetching series ${seriesId}:`, err);
  }

  return null;
}
