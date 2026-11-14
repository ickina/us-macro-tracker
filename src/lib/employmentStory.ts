import type { FredSeriesData } from './fred';

export const EMPLOYMENT_THEME_IDS = ['PAYEMS', 'ICSA', 'UNRATE'] as const;
export const EMPLOYMENT_FRESHNESS_DAYS = { monthly: 75, weekly: 14 } as const;
const EMPLOYMENT_VERSION_WINDOWS = { PAYEMS: 3, ICSA: 5, UNRATE: 2 } as const;

type Signal = 'strong' | 'weak' | 'neutral' | 'mixed';
type StoryStatus = 'strong' | 'weak' | 'mixed' | 'hold';
type NumericObservation = { date: string; value: number };

export type EmploymentStorySection = {
  title: string;
  description: string;
  lines: string[];
};

export type EmploymentStory = {
  status: StoryStatus;
  statusLabel: string;
  summary: string;
  sections: EmploymentStorySection[];
  dataDates: { payrolls?: string; claims?: string; unemployment?: string };
  cautions: string[];
};

const DAY_MS = 86_400_000;

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
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

export function createEmploymentStoryVersion(data: Record<string, FredSeriesData>) {
  const parts = EMPLOYMENT_THEME_IDS.map(id => {
    const window = observations(data[id]).slice(-EMPLOYMENT_VERSION_WINDOWS[id]);
    if (window.length < EMPLOYMENT_VERSION_WINDOWS[id]) return null;
    return `${id}:${window.map(item => `${item.date}=${item.value}`).join(',')}`;
  });
  return parts.some(part => part === null) ? null : `employment-v1|${parts.join('|')}`;
}

function daysBetween(earlier: string, later: string) {
  return Math.floor((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / DAY_MS);
}

function japanDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function formatMonth(date: string) {
  const [year, month] = date.split('-').map(Number);
  return `${year}年${month}月`;
}

function people(value: number) {
  return `${Math.abs(Math.round(value)).toLocaleString('ja-JP')}人`;
}

function signedPeople(value: number) {
  if (value === 0) return '変わりませんでした';
  return `${people(value)}${value > 0 ? '増えました' : '減りました'}`;
}

function points(value: number) {
  return `${Math.abs(value).toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}ポイント`;
}

function average(items: NumericObservation[]) {
  return items.reduce((sum, item) => sum + item.value, 0) / items.length;
}

function payrollMomentum(current: number, previous: number) {
  if (current > 0 && previous > 0) {
    const delta = current - previous;
    if (delta === 0) return '増加幅は前月と同じです。';
    return `増加幅は前月より${people(delta * 1_000)}${delta > 0 ? '広がりました' : '縮まりました'}。`;
  }
  if (current < 0 && previous < 0) {
    const delta = Math.abs(current) - Math.abs(previous);
    if (delta === 0) return '減少幅は前月と同じです。';
    return `減少幅は前月より${people(delta * 1_000)}${delta > 0 ? '広がりました' : '縮まりました'}。`;
  }
  const previousText = previous === 0 ? '増減なし' : `${people(previous * 1_000)}${previous > 0 ? '増' : '減'}`;
  const currentText = current === 0 ? '増減なし' : `${people(current * 1_000)}${current > 0 ? '増' : '減'}`;
  return `前月は${previousText}、今回は${currentText}です。`;
}

function signalLabel(signal: Signal, subject: 'payrolls' | 'claims' | 'unemployment') {
  const labels = {
    payrolls: { strong: '雇用者数は増加', weak: '雇用者数は減少', neutral: '雇用者数は横ばい', mixed: '雇用者数は判定保留' },
    claims: { strong: '申請件数は減少方向', weak: '申請件数は増加方向', neutral: '申請件数は横ばい', mixed: '申請件数は最新週と4週平均で方向が不一致' },
    unemployment: { strong: '失業率は低下', weak: '失業率は上昇', neutral: '失業率は横ばい', mixed: '失業率は判定保留' },
  } as const;
  return labels[subject][signal];
}

function payrollSignalLabel(signal: Signal, current: number, previous: number) {
  if (signal !== 'mixed') return signalLabel(signal, 'payrolls');
  if (current > 0 && previous > current) return '雇用者数は増加中ですが、増加幅は縮小';
  if (current < 0 && previous < current) return '雇用者数は減少中ですが、減少幅は縮小';
  return '雇用者数は前月から方向が変化';
}

export function buildEmploymentStory(data: Record<string, FredSeriesData>, referenceDate = japanDate()): EmploymentStory {
  const payrolls = observations(data.PAYEMS);
  const claims = observations(data.ICSA);
  const unemployment = observations(data.UNRATE);
  const dates = {
    payrolls: payrolls.at(-1)?.date,
    claims: claims.at(-1)?.date,
    unemployment: unemployment.at(-1)?.date,
  };
  const cautions: string[] = [];

  if (payrolls.length < 3) cautions.push('雇用者数は、増減幅を比べるための履歴が足りません。');
  if (claims.length < 5) cautions.push('失業保険申請は、直近4週平均と前週時点の4週平均を比べる履歴が足りません。');
  if (unemployment.length < 2) cautions.push('失業率は、前月差を計算する履歴が足りません。');

  for (const [label, date, limit] of [
    ['雇用者数', dates.payrolls, EMPLOYMENT_FRESHNESS_DAYS.monthly],
    ['失業保険申請', dates.claims, EMPLOYMENT_FRESHNESS_DAYS.weekly],
    ['失業率', dates.unemployment, EMPLOYMENT_FRESHNESS_DAYS.monthly],
  ] as const) {
    if (!date) continue;
    const age = daysBetween(date, referenceDate);
    if (age < 0) cautions.push(`${label}の観測日が確認基準日より後です。`);
    if (age > limit) cautions.push(`${label}は観測日から${age}日経過し、鮮度基準（${limit}日以内）を超えています。`);
  }

  if (dates.payrolls && dates.unemployment && dates.payrolls.slice(0, 7) !== dates.unemployment.slice(0, 7)) {
    cautions.push('雇用者数と失業率の対象月がそろっていません。');
  }

  const payrollLatest = payrolls.at(-1);
  const payrollPrevious = payrolls.at(-2);
  const payrollBefore = payrolls.at(-3);
  const payrollChangeThousands = payrollLatest && payrollPrevious ? payrollLatest.value - payrollPrevious.value : null;
  const payrollPreviousChangeThousands = payrollPrevious && payrollBefore ? payrollPrevious.value - payrollBefore.value : null;

  const claimsLatest = claims.at(-1);
  const claimsPrevious = claims.at(-2);
  const claimsChange = claimsLatest && claimsPrevious ? claimsLatest.value - claimsPrevious.value : null;
  const claimsAverage = claims.length >= 4 ? average(claims.slice(-4)) : null;
  const priorClaimsAverage = claims.length >= 5 ? average(claims.slice(-5, -1)) : null;
  const claimsAverageChange = claimsAverage !== null && priorClaimsAverage !== null ? claimsAverage - priorClaimsAverage : null;

  const unemploymentLatest = unemployment.at(-1);
  const unemploymentPrevious = unemployment.at(-2);
  const unemploymentChange = unemploymentLatest && unemploymentPrevious ? unemploymentLatest.value - unemploymentPrevious.value : null;

  const sectionOne: EmploymentStorySection = {
    title: '働く人は増えた？',
    description: '雇用者数は、農業以外で雇われて働く人の総数です。採用数や解雇数そのものではありません。',
    lines: payrollLatest && payrollChangeThousands !== null && payrollPreviousChangeThousands !== null ? [
      `${formatMonth(payrollLatest.date)}の雇用者数は、前月から${signedPeople(payrollChangeThousands * 1_000)}。`,
      payrollMomentum(payrollChangeThousands, payrollPreviousChangeThousands),
    ] : ['履歴不足のため、雇用者数の増減と勢いを計算できません。'],
  };

  const averageText = claimsAverageChange === 0 ? '前週時点と同じです。' : `前週時点より${people(claimsAverageChange ?? 0)}${(claimsAverageChange ?? 0) > 0 ? '増えました' : '減りました'}。`;
  const sectionTwo: EmploymentStorySection = {
    title: '失業のサインは？',
    description: '失業保険申請は週ごとの新規申請、失業率は月ごとの仕事を探す人の状況です。対象期間は異なります。',
    lines: claimsLatest && claimsChange !== null && claimsAverage !== null && claimsAverageChange !== null && unemploymentLatest && unemploymentChange !== null ? [
      `${formatDate(claimsLatest.date)}までの週の申請件数は${people(claimsLatest.value)}で、前週から${signedPeople(claimsChange)}。`,
      `直近4週平均は${people(claimsAverage)}で、${averageText}`,
      `${formatMonth(unemploymentLatest.date)}の失業率は${unemploymentLatest.value.toFixed(1)}％で、前月から${unemploymentChange === 0 ? '変わりませんでした' : `${points(unemploymentChange)}${unemploymentChange > 0 ? '上がりました' : '下がりました'}`}。`,
    ] : ['履歴不足のため、失業の動きをそろえて計算できません。'],
  };

  if (cautions.length > 0 || payrollChangeThousands === null || payrollPreviousChangeThousands === null || claimsChange === null || claimsAverageChange === null || unemploymentChange === null) {
    return {
      status: 'hold',
      statusLabel: '材料待ち',
      summary: '数字の期間や鮮度がそろっていないため、今回は無理に結論を出しません。',
      sections: [
        sectionOne,
        sectionTwo,
        { title: '3つを重ねると', description: '条件がそろわないときは、無理に結論を出しません。', lines: ['今回は材料待ちです。下の確認事項を先に解消します。'] },
        { title: '次はここを見る', description: '同じデータ一式がそろった時点で再計算します。', lines: cautions },
      ],
      dataDates: dates,
      cautions,
    };
  }

  const payrollSignal: Signal = payrollChangeThousands === 0
    ? 'neutral'
    : payrollChangeThousands > 0
      ? (payrollPreviousChangeThousands <= payrollChangeThousands ? 'strong' : 'mixed')
      : (payrollPreviousChangeThousands >= payrollChangeThousands ? 'weak' : 'mixed');
  const claimsSignal: Signal = claimsChange < 0 && claimsAverageChange < 0 ? 'strong' : claimsChange > 0 && claimsAverageChange > 0 ? 'weak' : claimsChange === 0 && claimsAverageChange === 0 ? 'neutral' : 'mixed';
  const unemploymentSignal: Signal = unemploymentChange < 0 ? 'strong' : unemploymentChange > 0 ? 'weak' : 'neutral';
  const signals = [payrollSignal, claimsSignal, unemploymentSignal];
  const status: StoryStatus = signals.every(item => item === 'strong') ? 'strong' : signals.every(item => item === 'weak') ? 'weak' : 'mixed';
  const statusLabel = status === 'strong' ? '雇用はまだ力強い' : status === 'weak' ? '雇用にブレーキの気配' : '強さの中に、少し揺れ';
  const summary = status === 'strong'
    ? '3つの数字がそろって改善方向です。今のところ、雇用の土台はしっかりしています。'
    : status === 'weak'
      ? '3つの数字がそろって弱い方向です。雇用の勢いにブレーキがかかっていないか、次の統計も確認します。'
      : '3つの動きはそろっていません。強い面と気になる動きを分けて見ます。';

  return {
    status,
    statusLabel,
    summary,
    sections: [
      sectionOne,
      sectionTwo,
      {
        title: '3つを重ねると',
        description: '多数決ではなく、企業の雇用・失業手当・仕事を探す人の状況を別々に確認します。',
        lines: [`${payrollSignalLabel(payrollSignal, payrollChangeThousands, payrollPreviousChangeThousands)}、${signalLabel(claimsSignal, 'claims')}、${signalLabel(unemploymentSignal, 'unemployment')}です。`, summary],
      },
      {
        title: '次はここを見る',
        description: '次の統計で同じ方向が続くかを確認します。',
        lines: ['雇用者数の増減幅、申請件数の4週平均、失業率の方向をそれぞれ確認します。', '週次と月次は対象期間が違うため、同じ時期の変化とは決めつけません。'],
      },
    ],
    dataDates: dates,
    cautions,
  };
}

