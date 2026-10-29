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

// 2026年 米政府・連銀（BEA / BLS / FRB）公式確定公表スケジュール
const OFFICIAL_SCHEDULE_OVERRIDES: Record<string, { gdp?: string; pce?: string; cpi?: string; nfp?: string; fomc?: string }> = {
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
    gdp: '2026-10-29',
    pce: '2026-10-29' // BEA公式: 第3四半期GDP速報値と9月PCEは同日同時公表 (GMO等と完全一致)
  },
  '2026-11': {
    fomc: '2026-11-05', // 11/4-5会合、日本時間11/5未明発表
    nfp: '2026-11-06',
    cpi: '2026-11-12',
    gdp: '2026-11-25', // 感謝祭のため前倒し公表
    pce: '2026-11-25'  // 感謝祭のため前倒し公表
  },
  '2026-12': {
    nfp: '2026-12-04',
    cpi: '2026-12-10',
    fomc: '2026-12-16',
    gdp: '2026-12-22',
    pce: '2026-12-23'  // クリスマス休暇のため前倒し公表
  }
};

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

    // 1. ISM製造業景況指数 (毎月第1営業日 23:00 JST)
    let ismDate = new Date(y, m, 1);
    while (ismDate.getDay() === 0 || ismDate.getDay() === 6) {
      ismDate.setDate(ismDate.getDate() + 1);
    }
    events.push({
      id: `ism-mfg-${y}-${m}`,
      title: 'ISM製造業景況指数',
      category: 'growth',
      impact: 'High',
      date: `${y}-${pad(m + 1)}-${pad(ismDate.getDate())}`,
      timeJST: '23:00',
      description: '米国の製造業購買担当者へのアンケート調査。50が好不況の分岐点。',
      period: `${prevMonthNum}月分`
    });

    // 2. 米雇用統計 (毎月第1金曜日 21:30 JST)
    let nfpDateStr = overrides.nfp;
    if (!nfpDateStr) {
      let nfpDate = new Date(y, m, 1);
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
      timeJST: '21:30',
      description: '非農業部門雇用者数・失業率・賃金インフレ。金融市場最大の注目指標。',
      period: `${prevMonthNum}月分`
    });

    // 3. ISM非製造業景況指数 (第3営業日前後 23:00 JST)
    let ismNfgDate = new Date(y, m, 3);
    while (ismNfgDate.getDay() === 0 || ismNfgDate.getDay() === 6) {
      ismNfgDate.setDate(ismNfgDate.getDate() + 1);
    }
    events.push({
      id: `ism-nonmfg-${y}-${m}`,
      title: 'ISM非製造業景況指数 (サービス業)',
      category: 'growth',
      impact: 'High',
      date: `${y}-${pad(m + 1)}-${pad(ismNfgDate.getDate())}`,
      timeJST: '23:00',
      description: '米経済の約8割を占めるサービス業の景況感を示す重要指標。',
      period: `${prevMonthNum}月分`
    });

    // 4. 消費者物価指数 (CPI) (毎月中旬 21:30 JST)
    let cpiDateStr = overrides.cpi;
    if (!cpiDateStr) {
      let cpiDate = new Date(y, m, 11);
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
      timeJST: '21:30',
      description: 'インフレの最重要先行指標。FRBの金融政策方針や金利動向を決定づける。',
      period: `${prevMonthNum}月分`
    });

    // 5. 生産者物価指数 (PPI) (CPIの翌営業日 21:30 JST)
    const baseCpi = new Date(cpiDateStr);
    let ppiDate = new Date(baseCpi);
    ppiDate.setDate(ppiDate.getDate() + 1);
    if (ppiDate.getDay() === 6) ppiDate.setDate(ppiDate.getDate() + 2);
    if (ppiDate.getDay() === 0) ppiDate.setDate(ppiDate.getDate() + 1);
    events.push({
      id: `ppi-${y}-${m}`,
      title: '生産者物価指数 (PPI)',
      category: 'inflation',
      impact: 'High',
      date: `${ppiDate.getFullYear()}-${pad(ppiDate.getMonth() + 1)}-${pad(ppiDate.getDate())}`,
      timeJST: '21:30',
      description: '企業間取引の価格動向。CPIへの先行性を持つ卸売物価指数。',
      period: `${prevMonthNum}月分`
    });

    // 6. 小売売上高 (毎月15日前後 21:30 JST)
    let retailDate = new Date(y, m, 15);
    while (retailDate.getDay() === 0 || retailDate.getDay() === 6) {
      retailDate.setDate(retailDate.getDate() + 1);
    }
    events.push({
      id: `retail-${y}-${m}`,
      title: '米小売売上高 (Retail Sales)',
      category: 'growth',
      impact: 'High',
      date: `${y}-${pad(m + 1)}-${pad(retailDate.getDate())}`,
      timeJST: '21:30',
      description: '米国の個人消費の力強さを測る最重要消費統計。',
      period: `${prevMonthNum}月分`
    });

    // 7. 実質GDP (BEA公式スケジュールまたは最終木曜 21:30 JST)
    let gdpDateStr = overrides.gdp;
    if (!gdpDateStr) {
      let gdpDate = new Date(y, m + 1, 0); // 月末日
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
      timeJST: '21:30',
      description: '米国経済全体の成長率を示す包括的なマクロ統計。',
      period: quarterStr
    });

    // 8. PCEデフレーター (BEA公式スケジュール: 四半期速報月はGDPと同日公表)
    let pceDateStr = overrides.pce;
    if (!pceDateStr) {
      if (monthNum % 3 === 1) {
        // 四半期末のGDP速報月は、BEAによりGDPと同日同時公表
        pceDateStr = gdpDateStr;
      } else {
        let pceDate = new Date(y, m + 1, 0);
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
      timeJST: '21:30',
      description: 'FRBがインフレ目標2%の公式基準とする最重要物価指標。',
      period: `${prevMonthNum}月分`
    });

    // 9. FOMC政策金利発表
    let fomcDateStr = overrides.fomc;
    const fomcSchedule2026: Record<number, number> = {
      0: 28, // 1月28日
      2: 18, // 3月18日
      4: 6,  // 5月6日
      5: 17, // 6月17日
      6: 29, // 7月29日
      8: 16, // 9月16日
      10: 5, // 11月5日
      11: 16 // 12月16日
    };

    if (!fomcDateStr && fomcSchedule2026[m] !== undefined) {
      fomcDateStr = `${y}-${pad(m + 1)}-${pad(fomcSchedule2026[m])}`;
    }

    if (fomcDateStr) {
      events.push({
        id: `fomc-${y}-${m}`,
        title: 'FOMC 政策金利発表 & パウエル議長会見',
        category: 'policy',
        impact: 'Critical',
        date: fomcDateStr,
        timeJST: '03:00 (会見 03:30)',
        description: 'FRBのFF金利誘導目標の決定、経済見通し(SEP)、議長定例記者会見。',
        period: '金融政策会合'
      });
    }

    // 10. ミシガン大学消費者態度指数 (第2金曜 23:00 JST)
    let michDate = new Date(y, m, 8);
    while (michDate.getDay() !== 5) {
      michDate.setDate(michDate.getDate() + 1);
    }
    events.push({
      id: `mich-${y}-${m}`,
      title: 'ミシガン大学消費者信頼感指数 (速報値 / 期待インフレ率)',
      category: 'growth',
      impact: 'Medium',
      date: `${y}-${pad(m + 1)}-${pad(michDate.getDate())}`,
      timeJST: '23:00',
      description: '消費者の景気見通しおよび1年先・5年先の期待インフレ率。',
      period: `${monthNum}月分`
    });
  }

  // 日付順にソート
  return events.sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(a.date).getTime();
    if (diff !== 0) return diff;
    return a.timeJST.localeCompare(b.timeJST);
  });
}
