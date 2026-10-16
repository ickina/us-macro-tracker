import { FredSeriesData } from './fred';

/**
 * クライアント側でリアルタイムに最新為替レートをマージする関数
 */
export async function syncLatestMacroDataClientSide(
  currentData: Record<string, FredSeriesData>
): Promise<Record<string, FredSeriesData>> {
  const updated: Record<string, FredSeriesData> = { ...currentData };

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
    // ネットワーク制限時は安全にスキップ
  }

  return updated;
}
