import type { EmploymentStory } from './employmentStory';
import type { InflationStory } from './inflationStory';

export type RateCutViewStatus = 'tailwind' | 'headwind' | 'tug' | 'hold';

export type RateCutView = {
  status: RateCutViewStatus;
  label: '追い風' | '逆風' | '綱引き' | '材料待ち';
  summary: string;
  checkNote: string;
};

const CHECK_NOTE = '市場の最新の織り込みは、金利先物などで確認してください。';

export function buildRateCutView(employment: EmploymentStory, inflation: InflationStory): RateCutView {
  if (employment.status === 'hold' || inflation.status === 'hold') {
    return {
      status: 'hold',
      label: '材料待ち',
      summary: '雇用と物価の対象期間や鮮度がそろうまで、利下げへの材料判断は保留します。',
      checkNote: CHECK_NOTE,
    };
  }

  if (employment.status === 'weak' && inflation.status === 'cooling') {
    return {
      status: 'tailwind',
      label: '追い風',
      summary: '物価は落ち着く方向で、雇用にも減速のサインがあります。利下げを後押しする材料がそろっています。',
      checkNote: CHECK_NOTE,
    };
  }

  if (employment.status === 'strong' && inflation.status === 'heating') {
    return {
      status: 'headwind',
      label: '逆風',
      summary: '物価は強まる方向で、雇用も底堅い状態です。利下げを後押しする材料はそろっていません。',
      checkNote: CHECK_NOTE,
    };
  }

  const employmentText = employment.status === 'strong'
    ? '雇用は底堅い方向'
    : employment.status === 'weak'
      ? '雇用には減速のサイン'
      : '雇用は強い面と弱い面が混在';
  const inflationText = inflation.status === 'cooling'
    ? '物価は落ち着く方向'
    : inflation.status === 'heating'
      ? '物価は強まる方向'
      : '物価の動きはまちまち';

  return {
    status: 'tug',
    label: '綱引き',
    summary: `${inflationText}ですが、${employmentText}です。利下げへの材料は一方向にそろっていません。`,
    checkNote: CHECK_NOTE,
  };
}
