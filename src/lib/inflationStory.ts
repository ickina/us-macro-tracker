import type { FredSeriesData } from './fred';

export const INFLATION_THEME_IDS = ['CPIAUCSL', 'CPILFESL', 'PCEPILFE'] as const;
export const INFLATION_FRESHNESS_DAYS = 75;
const INFLATION_VERSION_WINDOW = 3;

type InflationSignal = 'cooling' | 'heating' | 'neutral';
export type InflationStoryStatus = 'cooling' | 'heating' | 'mixed' | 'hold';
type NumericObservation = { date: string; value: number };

export type InflationStorySection = {
  title: string;
  description: string;
  lines: string[];
};

export type InflationStory = {
  status: InflationStoryStatus;
  statusLabel: string;
  summary: string;
  sections: InflationStorySection[];
  dataDates: { headlineCpi?: string; coreCpi?: string; corePce?: string };
  cautions: string[];
};

const DAY_MS = 86_400_000;

function validDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function observations(series?: FredSeriesData) {
  if (!series) return [];
  const byDate = new Map<string, number>();
  series.observations.forEach(item => {
    if (validDate(item.date) && item.value.trim() !== '' && Number.isFinite(Number(item.value))) {
      byDate.set(item.date, Number(item.value));
    }
  });
  return [...byDate].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
}

export function createInflationStoryVersion(data: Record<string, FredSeriesData>) {
  const parts = INFLATION_THEME_IDS.map(id => {
    const window = observations(data[id]).slice(-INFLATION_VERSION_WINDOW);
    if (window.length < INFLATION_VERSION_WINDOW) return null;
    return `${id}:${window.map(item => `${item.date}=${item.value}`).join(',')}`;
  });
  return parts.some(part => part === null) ? null : `inflation-v1|${parts.join('|')}`;
}

function japanDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function daysBetween(earlier: string, later: string) {
  return Math.floor((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / DAY_MS);
}

function formatMonth(date: string) {
  const [year, month] = date.split('-').map(Number);
  return `${year}年${month}月`;
}

function percent(value: number) {
  return `${value.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}％`;
}

function points(value: number) {
  return `${Math.abs(value).toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}ポイント`;
}

function changeText(change: number) {
  if (Math.abs(change) < 0.005) return '前月と同じです。';
  return `前月から${points(change)}${change > 0 ? '上がりました' : '下がりました'}。`;
}

function signal(change: number): InflationSignal {
  if (change > 0.005) return 'heating';
  if (change < -0.005) return 'cooling';
  return 'neutral';
}

function signalLabel(value: InflationSignal, subject: 'headlineCpi' | 'coreCpi' | 'corePce') {
  const names = { headlineCpi: 'CPI', coreCpi: 'コアCPI', corePce: 'コアPCE' } as const;
  const direction = value === 'cooling' ? '低下' : value === 'heating' ? '上昇' : '横ばい';
  return `${names[subject]}は${direction}`;
}

function latestChange(items: NumericObservation[]) {
  const latest = items.at(-1);
  const previous = items.at(-2);
  return latest && previous ? { latest, change: latest.value - previous.value } : null;
}

export function buildInflationStory(data: Record<string, FredSeriesData>, referenceDate = japanDate()): InflationStory {
  const headlineCpi = observations(data.CPIAUCSL);
  const coreCpi = observations(data.CPILFESL);
  const corePce = observations(data.PCEPILFE);
  const dates = {
    headlineCpi: headlineCpi.at(-1)?.date,
    coreCpi: coreCpi.at(-1)?.date,
    corePce: corePce.at(-1)?.date,
  };
  const cautions: string[] = [];

  if (headlineCpi.length < 2) cautions.push('CPIは、前月との変化を比べる履歴が足りません。');
  if (coreCpi.length < 2) cautions.push('コアCPIは、前月との変化を比べる履歴が足りません。');
  if (corePce.length < 2) cautions.push('コアPCEは、前月との変化を比べる履歴が足りません。');

  for (const [label, date] of [
    ['CPI', dates.headlineCpi],
    ['コアCPI', dates.coreCpi],
    ['コアPCE', dates.corePce],
  ] as const) {
    if (!date) continue;
    const age = daysBetween(date, referenceDate);
    if (age < 0) cautions.push(`${label}の観測日が確認基準日より後です。`);
    if (age > INFLATION_FRESHNESS_DAYS) cautions.push(`${label}は観測日から${age}日経過し、鮮度基準（${INFLATION_FRESHNESS_DAYS}日以内）を超えています。`);
  }

  const availableMonths = Object.values(dates).filter((date): date is string => Boolean(date)).map(date => date.slice(0, 7));
  if (availableMonths.length === 3 && new Set(availableMonths).size !== 1) {
    cautions.push('CPI・コアCPI・コアPCEの対象月がそろっていません。PCEの更新を確認してください。');
  }

  const headlineResult = latestChange(headlineCpi);
  const coreCpiResult = latestChange(coreCpi);
  const corePceResult = latestChange(corePce);

  const sectionOne: InflationStorySection = {
    title: '生活に近い物価は？',
    description: 'CPIは、家計が購入する幅広いモノやサービスの価格を前年同月と比べた数字です。',
    lines: headlineResult ? [
      `${formatMonth(headlineResult.latest.date)}のCPIは${percent(headlineResult.latest.value)}で、${changeText(headlineResult.change)}`,
    ] : ['履歴不足のため、CPIの前月からの変化を計算できません。'],
  };

  const sectionTwo: InflationStorySection = {
    title: '物価の基調は？',
    description: 'コアCPIとコアPCEは、一時的に動きやすい項目の影響を抑え、物価の基調を別の方法で見ます。',
    lines: coreCpiResult && corePceResult ? [
      `${formatMonth(coreCpiResult.latest.date)}のコアCPIは${percent(coreCpiResult.latest.value)}で、${changeText(coreCpiResult.change)}`,
      `${formatMonth(corePceResult.latest.date)}のコアPCEは${percent(corePceResult.latest.value)}で、${changeText(corePceResult.change)}`,
    ] : ['履歴不足のため、コアCPIとコアPCEの変化をそろえて計算できません。'],
  };

  if (cautions.length > 0 || !headlineResult || !coreCpiResult || !corePceResult) {
    return {
      status: 'hold',
      statusLabel: '材料待ち',
      summary: '数字の期間や鮮度がそろっていないため、今回は無理に結論を出しません。',
      sections: [
        sectionOne,
        sectionTwo,
        { title: '3つを重ねると', description: '条件がそろわないときは、無理に結論を出しません。', lines: ['今回は材料待ちです。下の確認事項を先に解消します。'] },
        { title: '次はここを見る', description: '同じ対象月のデータがそろった時点で再計算します。', lines: cautions },
      ],
      dataDates: dates,
      cautions,
    };
  }

  const headlineSignal = signal(headlineResult.change);
  const coreCpiSignal = signal(coreCpiResult.change);
  const corePceSignal = signal(corePceResult.change);
  const signals = [headlineSignal, coreCpiSignal, corePceSignal];
  const status: InflationStoryStatus = signals.every(item => item === 'cooling' || item === 'neutral') && signals.some(item => item === 'cooling')
    ? 'cooling'
    : signals.every(item => item === 'heating' || item === 'neutral') && signals.some(item => item === 'heating')
      ? 'heating'
      : 'mixed';
  const statusLabel = status === 'cooling' ? '物価は落ち着く方向' : status === 'heating' ? '物価に再加速の気配' : '物価の動きはまちまち';
  const summary = status === 'cooling'
    ? signals.every(item => item === 'cooling')
      ? '3つの数字がそろって低下しました。物価の伸びが落ち着く流れが続くか、次の統計も確認します。'
      : '3つの数字は低下または横ばいです。物価の伸びが落ち着く流れが続くか、次の統計も確認します。'
    : status === 'heating'
      ? signals.every(item => item === 'heating')
        ? '3つの数字がそろって上昇しました。物価の伸びが再び強まっていないか、次の統計も確認します。'
        : '3つの数字は上昇または横ばいです。物価の伸びが再び強まっていないか、次の統計も確認します。'
      : '3つの動きはそろっていません。全体の物価と基調を分けて見ます。';

  return {
    status,
    statusLabel,
    summary,
    sections: [
      sectionOne,
      sectionTwo,
      {
        title: '3つを重ねると',
        description: '多数決ではなく、全体の物価と2つの基調指標が同じ方向かを確認します。',
        lines: [`${signalLabel(headlineSignal, 'headlineCpi')}、${signalLabel(coreCpiSignal, 'coreCpi')}、${signalLabel(corePceSignal, 'corePce')}です。`, summary],
      },
      {
        title: '次はここを見る',
        description: '次の統計で同じ方向が続くかを確認します。',
        lines: ['CPI・コアCPI・コアPCEの前年同月比が、同じ対象月でそろって動くかを確認します。', '対象月がずれた場合は、遅い系列の更新を待ってから判断します。'],
      },
    ],
    dataDates: dates,
    cautions,
  };
}
