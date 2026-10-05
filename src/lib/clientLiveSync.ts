import { FredSeriesData, Observation } from './fred';
import { MacroNewsItem } from '@/app/api/news/route';
import { decodeHtmlEntities } from './clientNews';

// 公開FRED APIキー（環境変数またはフォールバック）
const PUBLIC_FRED_KEY = process.env.NEXT_PUBLIC_FRED_API_KEY || 'YOUR_FRED_API_KEY_HERE';

// リアルタイム同期対象の最重要指標（超軽量・高速フェッチ用）
const REALTIME_SERIES_CONFIG: { id: string; units?: string }[] = [
  { id: 'UNRATE' }, // 失業率
  { id: 'PAYEMS' }, // 非農業部門雇用者数
  { id: 'CES0500000003', units: 'pc1' }, // 平均時給 前年比
  { id: 'CIVPART' }, // 労働参加率
  { id: 'U6RATE' }, // U-6失業率
  { id: 'CPIAUCSL', units: 'pc1' }, // CPI 前年比
  { id: 'CPILFESL', units: 'pc1' }, // コアCPI 前年比
  { id: 'PCEPI', units: 'pc1' }, // PCE 前年比
  { id: 'PCEPILFE', units: 'pc1' }, // コアPCE 前年比
  { id: 'FEDFUNDS' }, // FF金利
  { id: 'DGS10' }, // 10年国債利回り
  { id: 'DGS2' }, // 2年国債利回り
  { id: 'SP500' }, // S&P500
  { id: 'VIXCLS' }, // VIX
];

/**
 * クライアント側で負担なくスムーズに最新指標を即時取得・マージする関数
 * - 画面表示を一切ブロックせず、高速に最新値のみをピンポイント差分更新
 */
export async function syncLatestMacroDataClientSide(
  currentData: Record<string, FredSeriesData>
): Promise<Record<string, FredSeriesData>> {
  const updated: Record<string, FredSeriesData> = { ...currentData };

  // 1. 為替レートのリアルタイム更新（完全無料・認証不要・即時）
  try {
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });

    if (fxRes.ok) {
      const fxData = await fxRes.json();
      if (fxData.rates) {
        const now = new Date();
        const day = now.getDay();
        if (day === 0) now.setDate(now.getDate() - 2);
        else if (day === 6) now.setDate(now.getDate() - 1);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const todayDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

        // ドル円
        if (updated.DEXJPUS && typeof fxData.rates.JPY === 'number') {
          const jpy = fxData.rates.JPY;
          if (jpy >= 80 && jpy <= 250) {
            const obs = [...updated.DEXJPUS.observations];
            const last = obs.length > 0 ? obs[obs.length - 1] : null;
            if (last) {
              if (last.date === todayDate) last.value = jpy.toFixed(2);
              else if (last.date < todayDate) obs.push({ date: todayDate, value: jpy.toFixed(2) });
            }
            updated.DEXJPUS = { ...updated.DEXJPUS, observations: obs };
          }
        }

        // ユーロドル
        if (updated.DEXUSEU && typeof fxData.rates.EUR === 'number') {
          const eurRate = 1 / fxData.rates.EUR;
          if (eurRate >= 0.5 && eurRate <= 2.0) {
            const obs = [...updated.DEXUSEU.observations];
            const last = obs.length > 0 ? obs[obs.length - 1] : null;
            if (last) {
              if (last.date === todayDate) last.value = eurRate.toFixed(4);
              else if (last.date < todayDate) obs.push({ date: todayDate, value: eurRate.toFixed(4) });
            }
            updated.DEXUSEU = { ...updated.DEXUSEU, observations: obs };
          }
        }
      }
    }
  } catch (err) {
    // サイレントフォールバック
  }

  // 2. FRED API から最新観測値の差分フェッチ（キーがある場合）
  if (PUBLIC_FRED_KEY && PUBLIC_FRED_KEY !== 'YOUR_FRED_API_KEY_HERE') {
    try {
      const fetchPromises = REALTIME_SERIES_CONFIG.map(async (conf) => {
        try {
          const unitsParam = conf.units ? `&units=${conf.units}` : '';
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${conf.id}&api_key=${PUBLIC_FRED_KEY}&file_type=json&sort_order=desc&limit=3${unitsParam}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
          if (!res.ok) return null;
          const json = await res.json();
          if (json.observations && json.observations.length > 0) {
            return { seriesId: conf.id, latestObs: json.observations[0] as Observation };
          }
        } catch {
          return null;
        }
        return null;
      });

      const results = await Promise.all(fetchPromises);

      results.forEach((res) => {
        if (res && res.latestObs && updated[res.seriesId]) {
          const obs = [...updated[res.seriesId].observations];
          const last = obs.length > 0 ? obs[obs.length - 1] : null;
          const newDate = res.latestObs.date;
          const newVal = res.latestObs.value;

          if (newVal && newVal !== '.') {
            if (last) {
              if (last.date === newDate) {
                last.value = parseFloat(newVal).toFixed(2);
              } else if (last.date < newDate) {
                obs.push({ date: newDate, value: parseFloat(newVal).toFixed(2) });
              }
            }
            updated[res.seriesId] = { ...updated[res.seriesId], observations: obs };
          }
        }
      });
    } catch {
      // ネットワーク不安定時も既存データで安全動作
    }
  }

  return updated;
}
