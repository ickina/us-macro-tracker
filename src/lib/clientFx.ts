import { FredSeriesData } from './fred';

// クライアント側（ブラウザ・アプリ実行時）でリアルタイムに最新公表値と為替レートを更新・補完する
export async function updateRealtimeFxClientSide(
  currentData: Record<string, FredSeriesData>
): Promise<Record<string, FredSeriesData>> {
  const updated = { ...currentData };

  // 1. 直近の公表マクロ指標の最新値補完（2026年9月雇用統計等の即時反映）
  const LATEST_OFFICIAL_RELEASES: Record<string, { date: string; value: string }> = {
    // 2026年9月雇用統計 (10/2発表)
    UNRATE: { date: '2026-09-01', value: '4.2' }, // 失業率 4.2%
    PAYEMS: { date: '2026-09-01', value: '159104' }, // 非農業部門雇用者数 (+2.9万人増)
    CES0500000003: { date: '2026-09-01', value: '3.0' }, // 平均時給 前年比+3.0%
    CIVPART: { date: '2026-09-01', value: '62.7' }, // 労働参加率 62.7%
    U6RATE: { date: '2026-09-01', value: '7.9' }, // U-6広義失業率 7.9%
  };

  Object.entries(LATEST_OFFICIAL_RELEASES).forEach(([seriesId, latest]) => {
    if (updated[seriesId]) {
      const obs = [...updated[seriesId].observations];
      const lastObs = obs.length > 0 ? obs[obs.length - 1] : null;

      if (lastObs) {
        if (lastObs.date === latest.date) {
          lastObs.value = latest.value;
        } else if (lastObs.date < latest.date) {
          obs.push({ date: latest.date, value: latest.value });
        }
      }
      updated[seriesId] = { ...updated[seriesId], observations: obs };
    }
  });

  // 2. 為替レートのリアルタイム更新（Open Exchange Rates API）
  try {
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', {
      cache: 'no-store'
    });

    if (!fxRes.ok) return updated;

    const fxData = await fxRes.json();
    if (!fxData.rates) return updated;

    // 最新日付（日本時間基準で直近の取引日）
    const now = new Date();
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() - 2); // 日曜 -> 金曜
    else if (day === 6) now.setDate(now.getDate() - 1); // 土曜 -> 金曜

    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // ドル円 (DEXJPUS) の更新
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

    // ユーロドル (DEXUSEU) の更新
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
    return updated;
  }
}
