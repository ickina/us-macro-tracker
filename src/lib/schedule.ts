export interface EconomicEvent {
  id: string;
  title: string;
  category: 'policy' | 'inflation' | 'employment' | 'growth' | 'market';
  impact: 'Critical' | 'High' | 'Medium';
  date: string; // YYYY-MM-DD
  timeJST: string; // HH:mm
  description: string;
  period: string; // 対象月（例: 8月分）
}

// 2026年 米国夏時間（Daylight Saving Time: DST）の正確な判定関数
// 米国夏時間: 3月第2日曜日 〜 11月第1日曜日 (2026年は 3/8 〜 11/1)
export function isUsDaylightSavingTime(dateStr: string): boolean {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  if (year !== 2026) {
    // 2026年以外の汎用計算
    const mar1 = new Date(year, 2, 1);
    const secondSunMar = 1 + (7 - mar1.getDay()) % 7 + 7;
    const nov1 = new Date(year, 10, 1);
    const firstSunNov = 1 + (7 - nov1.getDay()) % 7;
    const dstStart = new Date(year, 2, secondSunMar);
    const dstEnd = new Date(year, 10, firstSunNov);
    return d >= dstStart && d < dstEnd;
  }
  // 2026年の確定夏時間期間: 2026-03-08 〜 2026-11-01
  return dateStr >= '2026-03-08' && dateStr < '2026-11-01';
}

type ScheduleOverrides = {
  gdp?: string;
  pce?: string;
  cpi?: string;
  nfp?: string;
  ppi?: string;
  retail?: string;
  housing?: string;
  fomc?: string;
};

// 米政府・連銀（BEA / BLS / Census / FRB）公式確定公表スケジュール
// ※2026年のFOMCは11月会合は存在せず、10/27-28の次は12/8-9です。
const OFFICIAL_SCHEDULE_OVERRIDES: Record<string, ScheduleOverrides> = {
  '2026-09': {
    nfp: '2026-09-04',
    cpi: '2026-09-11',
    fomc: '2026-09-16',
    gdp: '2026-09-24',
    pce: '2026-09-25'
  },
  '2026-10': {
    nfp: '2026-10-02',
    cpi: '2026-10-14',
    fomc: '2026-10-28', // 10/27-28会合 (声明文公表)
    gdp: '2026-10-29',
    pce: '2026-10-29' // BEA公式: Q3 GDP速報と9月PCEは同日公表
  },
  '2026-11': {
    // 2026年11月はFOMC会合なし（FRB公式年間カレンダー準拠）
    nfp: '2026-11-06',    // 10月分雇用統計 (BLS公式: 11/6 22:30 JST)
    cpi: '2026-11-10',    // 10月分CPI (BLS公式: 11/10 22:30 JST)
    ppi: '2026-11-11',    // 10月分PPI (BLS公式: 11/11 22:30 JST)
    retail: '2026-11-17', // 10月分小売売上高 (22:30 JST)
    housing: '2026-11-18', // 10月分住宅着工・建設許可 (Census公式: 11/18 22:30 JST)
    gdp: '2026-11-25',    // Q3 GDP改定値 (BEA公式: 11/25 22:30 JST 感謝祭前倒し)
    pce: '2026-11-25'     // 10月分PCEデフレーター (BEA公式: 11/25 22:30 JST 感謝祭前倒し)
  },
  '2026-12': {
    nfp: '2026-12-04',    // 11月分雇用統計 (BLS公式: 12/4 22:30 JST)
    fomc: '2026-12-09',   // 12/8-9会合 (FRB公式: 日本時間12/10 04:00 JST / SEPドットチャートあり)
    cpi: '2026-12-10',    // 11月分CPI (BLS公式: 12/10 22:30 JST)
    ppi: '2026-12-11',    // 11月分PPI
    housing: '2026-12-17', // 11月分住宅着工・建設許可 (Census公式)
    gdp: '2026-12-22',    // Q3 GDP確定値
    pce: '2026-12-23'     // 11月分PCE (クリスマス前倒し)
  },
  '2027-01': {
    housing: '2027-01-20' // 12月分住宅着工・建設許可 (Census公式)
  }
};

// FRB公式カレンダーに掲載された2026年FOMC議事要旨の公表日（米国東部時間）。
// 14:00 ETのため、日本では必ず翌日の03:00（夏時間）または04:00（標準時間）になる。
const FOMC_MINUTES_RELEASES_2026 = [
  { releaseDateUs: '2026-02-18', meeting: '1月27–28日会合' },
  { releaseDateUs: '2026-04-08', meeting: '3月17–18日会合' },
  { releaseDateUs: '2026-05-20', meeting: '4月28–29日会合' },
  { releaseDateUs: '2026-07-08', meeting: '6月16–17日会合' },
  { releaseDateUs: '2026-08-19', meeting: '7月28–29日会合' },
  { releaseDateUs: '2026-10-07', meeting: '9月15–16日会合' },
  { releaseDateUs: '2026-11-18', meeting: '10月27–28日会合' },
  { releaseDateUs: '2026-12-30', meeting: '12月8–9日会合' },
] as const;

// 米国発表時刻に応じた日本時間（JST）の動的決定ヘルパー
function getJstTimeForUs830(dateStr: string): string {
  return isUsDaylightSavingTime(dateStr) ? '21:30' : '22:30';
}

function getJstTimeForUs1000(dateStr: string): string {
  return isUsDaylightSavingTime(dateStr) ? '23:00' : '24:00';
}

function addCalendarDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function getJstDateForUs1400(dateStr: string): string {
  return addCalendarDays(dateStr, 1);
}

function getJstTimeForUs1400(dateStr: string): string {
  return isUsDaylightSavingTime(dateStr) ? '03:00' : '04:00';
}

function getJstTimeForFomc(dateStr: string): string {
  const statementTime = getJstTimeForUs1400(dateStr);
  const pressConferenceTime = isUsDaylightSavingTime(dateStr) ? '03:30' : '04:30';
  return `${statementTime} (会見 ${pressConferenceTime})`;
}

// 毎月の定例発表ルールに基づき、指定された年月以降のイベントを自動生成する
export function generateUpcomingEvents(baseDate: Date = new Date()): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth(); // 0-indexed

  // 今月、来月、再来月の3ヶ月分のスケジュールを自動計算
  for (let offset = 0; offset <= 2; offset++) {
    const targetMonthDate = new Date(currentYear, currentMonth + offset, 1);
    const y = targetMonthDate.getFullYear();
    const m = targetMonthDate.getMonth(); // 0 = Jan, 8 = Sep
    const monthNum = m + 1;
    const prevMonthNum = m === 0 ? 12 : m;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const ymKey = `${y}-${pad(monthNum)}`;
    const overrides = OFFICIAL_SCHEDULE_OVERRIDES[ymKey] || {};

    // 1. ISM製造業景況指数 (毎月第1営業日 米国10:00 AM)
    const ismDate = new Date(y, m, 1);
    while (ismDate.getDay() === 0 || ismDate.getDay() === 6) {
      ismDate.setDate(ismDate.getDate() + 1);
    }
    const ismDateStr = `${y}-${pad(m + 1)}-${pad(ismDate.getDate())}`;
    events.push({
      id: `ism-mfg-${y}-${m}`,
      title: 'ISM製造業景況指数',
      category: 'growth',
      impact: 'High',
      date: ismDateStr,
      timeJST: getJstTimeForUs1000(ismDateStr),
      description: '米国の製造業購買担当者へのアンケート調査。50が好不況の分岐点。',
      period: `${prevMonthNum}月分`
    });

    // 2. 米雇用統計 (毎月第1金曜日 米国8:30 AM)
    let nfpDateStr = overrides.nfp;
    if (!nfpDateStr) {
      const nfpDate = new Date(y, m, 1);
      while (nfpDate.getDay() !== 5) {
        nfpDate.setDate(nfpDate.getDate() + 1);
      }
      nfpDateStr = `${y}-${pad(m + 1)}-${pad(nfpDate.getDate())}`;
    }
    events.push({
      id: `nfp-${y}-${m}`,
      title: '米雇用統計 (NFP / 失業率 / 平均時給)',
      category: 'employment',
      impact: 'Critical',
      date: nfpDateStr,
      timeJST: getJstTimeForUs830(nfpDateStr),
      description: '非農業部門雇用者数・失業率・賃金インフレ。金融市場最大の注目指標。',
      period: `${prevMonthNum}月分`
    });

    // 3. ISM非製造業景況指数 (第3営業日前後 米国10:00 AM)
    const ismNfgDate = new Date(y, m, 3);
    while (ismNfgDate.getDay() === 0 || ismNfgDate.getDay() === 6) {
      ismNfgDate.setDate(ismNfgDate.getDate() + 1);
    }
    const ismNfgDateStr = `${y}-${pad(m + 1)}-${pad(ismNfgDate.getDate())}`;
    events.push({
      id: `ism-nonmfg-${y}-${m}`,
      title: 'ISM非製造業景況指数 (サービス業)',
      category: 'growth',
      impact: 'High',
      date: ismNfgDateStr,
      timeJST: getJstTimeForUs1000(ismNfgDateStr),
      description: '米経済の約8割を占めるサービス業の景況感を示す重要指標。',
      period: `${prevMonthNum}月分`
    });

    // 4. 消費者物価指数 (CPI) (毎月中旬 米国8:30 AM)
    let cpiDateStr = overrides.cpi;
    if (!cpiDateStr) {
      const cpiDate = new Date(y, m, 11);
      while (cpiDate.getDay() !== 3 && cpiDate.getDay() !== 4) {
        cpiDate.setDate(cpiDate.getDate() + 1);
      }
      cpiDateStr = `${y}-${pad(m + 1)}-${pad(cpiDate.getDate())}`;
    }
    events.push({
      id: `cpi-${y}-${m}`,
      title: '消費者物価指数 (CPI & コアCPI)',
      category: 'inflation',
      impact: 'Critical',
      date: cpiDateStr,
      timeJST: getJstTimeForUs830(cpiDateStr),
      description: 'インフレの最重要先行指標。FRBの金融政策方針や金利動向を決定づける。',
      period: `${prevMonthNum}月分`
    });

    // 5. 生産者物価指数 (PPI) (CPIの翌営業日 米国8:30 AM)
    let ppiDateStr = overrides.ppi;
    if (!ppiDateStr) {
      const baseCpi = new Date(cpiDateStr);
      const ppiDate = new Date(baseCpi);
      ppiDate.setDate(ppiDate.getDate() + 1);
      if (ppiDate.getDay() === 6) ppiDate.setDate(ppiDate.getDate() + 2);
      if (ppiDate.getDay() === 0) ppiDate.setDate(ppiDate.getDate() + 1);
      ppiDateStr = `${ppiDate.getFullYear()}-${pad(ppiDate.getMonth() + 1)}-${pad(ppiDate.getDate())}`;
    }
    events.push({
      id: `ppi-${y}-${m}`,
      title: '生産者物価指数 (PPI)',
      category: 'inflation',
      impact: 'High',
      date: ppiDateStr,
      timeJST: getJstTimeForUs830(ppiDateStr),
      description: '企業間取引の価格動向。CPIへの先行性を持つ卸売物価指数。',
      period: `${prevMonthNum}月分`
    });

    // 6. 小売売上高 (毎月15日前後 米国8:30 AM)
    let retailDateStr = overrides.retail;
    if (!retailDateStr) {
      const retailDate = new Date(y, m, 15);
      while (retailDate.getDay() === 0 || retailDate.getDay() === 6) {
        retailDate.setDate(retailDate.getDate() + 1);
      }
      retailDateStr = `${y}-${pad(m + 1)}-${pad(retailDate.getDate())}`;
    }
    events.push({
      id: `retail-${y}-${m}`,
      title: '米小売売上高 (Retail Sales)',
      category: 'growth',
      impact: 'High',
      date: retailDateStr,
      timeJST: getJstTimeForUs830(retailDateStr),
      description: '米国の個人消費の力強さを測る最重要消費統計。',
      period: `${prevMonthNum}月分`
    });

    // 7. 住宅着工・建設許可 (Census公式 米国8:30 AM)
    // 同じ「New Residential Construction」公表に含まれるため、別カードへ重複させない。
    if (overrides.housing) {
      events.push({
        id: `housing-${y}-${m}`,
        title: '米住宅着工件数・建設許可件数',
        category: 'growth',
        impact: 'High',
        date: overrides.housing,
        timeJST: getJstTimeForUs830(overrides.housing),
        description: '住宅建設の着工と今後の建設計画を示す、米住宅市場の先行材料。',
        period: `${prevMonthNum}月分`
      });
    }

    // 8. 実質GDP (BEA公式スケジュールまたは最終木曜 米国8:30 AM)
    let gdpDateStr = overrides.gdp;
    if (!gdpDateStr) {
      const gdpDate = new Date(y, m + 1, 0); // 月末日
      while (gdpDate.getDay() !== 4) {
        gdpDate.setDate(gdpDate.getDate() - 1);
      }
      gdpDateStr = `${y}-${pad(m + 1)}-${pad(gdpDate.getDate())}`;
    }
    const quarterStr = monthNum <= 3 ? '第4四半期' : monthNum <= 6 ? '第1四半期' : monthNum <= 9 ? '第2四半期' : '第3四半期';
    events.push({
      id: `gdp-${y}-${m}`,
      title: `米実質GDP (${monthNum % 3 === 1 ? '速報値' : monthNum % 3 === 2 ? '改定値' : '確定値'})`,
      category: 'growth',
      impact: 'Critical',
      date: gdpDateStr,
      timeJST: getJstTimeForUs830(gdpDateStr),
      description: '米国経済全体の成長率を示す包括的なマクロ統計。',
      period: quarterStr
    });

    // 9. PCEデフレーター (BEA公式スケジュール: 米国8:30 AM)
    let pceDateStr = overrides.pce;
    if (!pceDateStr) {
      if (monthNum % 3 === 1) {
        pceDateStr = gdpDateStr;
      } else {
        const pceDate = new Date(y, m + 1, 0);
        while (pceDate.getDay() !== 5) {
          pceDate.setDate(pceDate.getDate() - 1);
        }
        pceDateStr = `${y}-${pad(m + 1)}-${pad(pceDate.getDate())}`;
      }
    }
    events.push({
      id: `pce-${y}-${m}`,
      title: '個人消費支出 (PCEデフレーター & コアPCE)',
      category: 'inflation',
      impact: 'Critical',
      date: pceDateStr,
      timeJST: getJstTimeForUs830(pceDateStr),
      description: 'FRBがインフレ目標2%の公式基準とする最重要物価指標。',
      period: `${prevMonthNum}月分`
    });

    // 10. FOMC政策金利発表 (2026年FRB公式年間スケジュール)
    let fomcDateStr = overrides.fomc;
    const fomcSchedule2026: Record<number, number> = {
      0: 28, // 1月28日
      2: 18, // 3月18日 (SEP)
      3: 29, // 4月29日
      5: 17, // 6月17日 (SEP)
      6: 29, // 7月29日
      8: 16, // 9月16日 (SEP)
      9: 28, // 10月28日
      11: 9  // 12月9日 (SEP - 日本時間12/10未明)
      // ※11月(m=10)はFOMC会合自体が存在しません
    };

    if (!fomcDateStr && fomcSchedule2026[m] !== undefined) {
      fomcDateStr = `${y}-${pad(m + 1)}-${pad(fomcSchedule2026[m])}`;
    }

    if (fomcDateStr) {
      const fomcDateJst = getJstDateForUs1400(fomcDateStr);
      events.push({
        id: `fomc-${y}-${m}`,
        title: 'FOMC 政策金利発表 & パウエル議長会見',
        category: 'policy',
        impact: 'Critical',
        date: fomcDateJst,
        timeJST: getJstTimeForFomc(fomcDateStr),
        description: 'FRBのFF金利誘導目標の決定、経済見通し(SEP)、議長定例記者会見。',
        period: '金融政策会合'
      });
    }

    // 11. FOMC議事要旨 (FRB公式 米国14:00 ET)
    for (const minutes of FOMC_MINUTES_RELEASES_2026) {
      if (!minutes.releaseDateUs.startsWith(ymKey)) continue;
      events.push({
        id: `fomc-minutes-${minutes.releaseDateUs}`,
        title: 'FOMC 議事要旨',
        category: 'policy',
        impact: 'Critical',
        date: getJstDateForUs1400(minutes.releaseDateUs),
        timeJST: getJstTimeForUs1400(minutes.releaseDateUs),
        description: '政策決定時の議論や、委員が重視した景気・物価・金利の材料を確認する公表。',
        period: minutes.meeting
      });
    }

    // 12. ミシガン大学消費者態度指数 (第2金曜 米国10:00 AM)
    const michDate = new Date(y, m, 8);
    while (michDate.getDay() !== 5) {
      michDate.setDate(michDate.getDate() + 1);
    }
    const michDateStr = `${y}-${pad(m + 1)}-${pad(michDate.getDate())}`;
    events.push({
      id: `mich-${y}-${m}`,
      title: 'ミシガン大学消費者信頼感指数 (速報値 / 期待インフレ率)',
      category: 'growth',
      impact: 'Medium',
      date: michDateStr,
      timeJST: getJstTimeForUs1000(michDateStr),
      description: '消費者の景気見通しおよび1年先・5年先の期待インフレ率。',
      period: `${monthNum}月分`
    });
  }

  // 日付順に正確にソート
  return events.sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (diff !== 0) return diff;
    return a.timeJST.localeCompare(b.timeJST);
  });
}
