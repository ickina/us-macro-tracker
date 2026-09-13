import { FredSeriesData } from './fred';

// クライアント側（ブラウザ・アプリ実行時）でリアルタイムに為替の最新値と日付を更新する
export async function updateRealtimeFxClientSide(
  currentData: Record<string, FredSeriesData>
): Promise<Record<string, FredSeriesData>> {
  try {
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', {
      cache: 'no-store'
    });

    if (!fxRes.ok) return currentData;

    const fxData = await fxRes.json();
    if (!fxData.rates) return currentData;

    // 最新日付（日本時間基準で直近の取引日）
    const now = new Date();
    // もし日曜なら金曜、土曜なら金曜の日付
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() - 2); // 日曜 -> 金曜
    else if (day === 6) now.setDate(now.getDate() - 1); // 土曜 -> 金曜

    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const updated = { ...currentData };

    // 1. ドル円 (DEXJPUS) の更新
    if (updated.DEXJPUS && typeof fxData.rates.JPY === 'number') {
      const jpyRate = fxData.rates.JPY;
      if (jpyRate >= 80 && jpyRate <= 250) {
        const obs = [...updated.DEXJPUS.observations];
        const latestObs = obs.length > 0 ? obs[obs.length - 1] : null;

        if (latestObs) {
          if (latestObs.date === todayDate) {
            latestObs.value = jpyRate.toFixed(2);
          } else if (latestObs.date < todayDate) {
            obs.push({ date: todayDate, value: jpyRate.toFixed(2) });
          }
        }
        updated.DEXJPUS = { ...updated.DEXJPUS, observations: obs };
      }
    }

    // 2. ユーロドル (DEXUSEU) の更新
    if (updated.DEXUSEU && typeof fxData.rates.EUR === 'number') {
      const eurRate = 1 / fxData.rates.EUR;
      if (eurRate >= 0.5 && eurRate <= 2.0) {
        const obs = [...updated.DEXUSEU.observations];
        const latestObs = obs.length > 0 ? obs[obs.length - 1] : null;

        if (latestObs) {
          if (latestObs.date === todayDate) {
            latestObs.value = eurRate.toFixed(4);
          } else if (latestObs.date < todayDate) {
            obs.push({ date: todayDate, value: eurRate.toFixed(4) });
          }
        }
        updated.DEXUSEU = { ...updated.DEXUSEU, observations: obs };
      }
    }

    return updated;
  } catch (err) {
    console.warn('Client-side FX update skipped safely:', err);
    return currentData;
  }
}
