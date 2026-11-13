import type { Observation } from './fred';

type Guide = { up: string; down: string; flat: string; definition: string; reading: string; digits: number; unit: string };
const guides = new Map<string, Guide>([
  ['DEXUSEU', { up: 'ユーロが強く、ドルが弱く', down: 'ユーロが弱く、ドルが強く', flat: '前回と変わらず', definition: '1ユーロを何ドルに交換できるか、という数字です。', reading: '数字が上がるとユーロが強くなり、下がるとドルが強くなります。', digits: 4, unit: 'ドル／ユーロ' }],
  ['DTWEXBGS', { up: 'ドルが強くなりました', down: 'ドルが弱くなりました', flat: '前回と変わらず', definition: 'いろいろな国の通貨と比べた、ドルの強さです。', reading: '数字が上がるとドルが強く、下がると弱くなります。よく使われるDXYとは別の指数です。', digits: 2, unit: '指数' }],
  ['DGS10', { up: '米国の長期金利が上がりました', down: '米国の長期金利が下がりました', flat: '前回と変わらず', definition: '米国に10年間お金を貸すときの、年あたりの収益率です。', reading: '一般に、この金利が上がると、すでに売られている国債の価格は下がります。', digits: 2, unit: '％' }],
  ["DEXJPUS", {"up": "円が弱く、ドルが強く", "down": "円が強く、ドルが弱く", "flat": "前回と変わらず", "definition": "1ドルを何円に交換できるか、という数字です。", "reading": "数字が上がると円安、下がると円高です。マーケットとはデータの日付や取得元が異なります。", "digits": 2, "unit": "円／ドル"}],
  ["FEDFUNDS", {"up": "銀行間の金利が上がりました", "down": "銀行間の金利が下がりました", "flat": "前回と変わらず", "definition": "米国の銀行同士がお金を一晩貸し借りする金利です。", "reading": "実際の取引金利の月平均です。FRBが決める目標の範囲そのものではありません。", "digits": 2, "unit": "％"}],
  ["DGS2", {"up": "米国の2年金利が上がりました", "down": "米国の2年金利が下がりました", "flat": "前回と変わらず", "definition": "米国に2年間お金を貸すときの、年あたりの収益率です。", "reading": "FRBの今後の利上げ・利下げの見通しに影響されます。金利と国債の価格は、一般に逆に動きます。", "digits": 2, "unit": "％"}],
  ["T10Y2Y", {"up": "長短の金利差が上がりました", "down": "長短の金利差が下がりました", "flat": "前回と変わらず", "definition": "10年金利から2年金利を引いた差です。", "reading": "マイナスは、短い期間の金利のほうが高い状態です。「逆イールド」と呼びます。景気を見る手がかりの一つです。", "digits": 2, "unit": "ポイント"}],
  ["T10Y3M", {"up": "長短の金利差が上がりました", "down": "長短の金利差が下がりました", "flat": "前回と変わらず", "definition": "10年金利から3か月金利を引いた差です。", "reading": "マイナスは、短い期間の金利のほうが高い状態です。「逆イールド」と呼びます。これだけで不況の時期は決まりません。", "digits": 2, "unit": "ポイント"}],
  ["DFII10", {"up": "物価分を除いた金利が上がりました", "down": "物価分を除いた金利が下がりました", "flat": "前回と変わらず", "definition": "物価の変化に合わせて元本が変わる、米10年国債の金利です。", "reading": "物価上昇の影響を除いた金利の目安です。普通の10年国債の金利とは違います。", "digits": 2, "unit": "％"}],
  ["T10YIE", {"up": "市場の物価見通しが上がりました", "down": "市場の物価見通しが下がりました", "flat": "前回と変わらず", "definition": "債券市場が見込む、今後10年の物価上昇率の目安です。", "reading": "普通の国債と物価連動国債の金利差です。投資家の不安などにも左右され、純粋な予測だけではありません。", "digits": 2, "unit": "％"}],
  ["BAMLH0A0HYM2", {"up": "上乗せ金利が増えました", "down": "上乗せ金利が減りました", "flat": "前回と変わらず", "definition": "信用力が低めの企業がお金を借りるときの、国債に対する上乗せ金利です。", "reading": "大きくなるほど、投資家が返済への不安などに備え、高い金利を求めている目安です。", "digits": 2, "unit": "ポイント"}],
  ["CPIAUCSL", {"up": "物価の伸び率が上がりました", "down": "物価の伸び率が下がりました", "flat": "前回と変わらず", "definition": "身近な商品やサービスの値段が、1年前から何％変わったかです。", "reading": "プラスなら1年前より値上がり、マイナスなら値下がりです。プラスのまま数字が下がっても、値段が下がったとは限りません。", "digits": 2, "unit": "％"}],
  ["CPILFESL", {"up": "物価の伸び率が上がりました", "down": "物価の伸び率が下がりました", "flat": "前回と変わらず", "definition": "食品とエネルギーを除いた物価が、1年前から何％変わったかです。", "reading": "一時的な値動きを除いて、値上がりの流れを見ます。伸び率が下がることと、値段が下がることは別です。", "digits": 2, "unit": "％"}],
  ["PCEPI", {"up": "物価の伸び率が上がりました", "down": "物価の伸び率が下がりました", "flat": "前回と変わらず", "definition": "家計が買う商品やサービスの物価が、1年前から何％変わったかです。", "reading": "FRBが重視する物価の数字です。プラスなら値上がりです。プラスのまま数字が下がると、値上がりのペースが鈍った目安です。", "digits": 2, "unit": "％"}],
  ["PCEPILFE", {"up": "物価の伸び率が上がりました", "down": "物価の伸び率が下がりました", "flat": "前回と変わらず", "definition": "PCE物価から食品とエネルギーを除いた、1年前からの変化率です。", "reading": "物価の基調を見るための数字です。伸び率が下がっても、値段そのものが下がったとは限りません。", "digits": 2, "unit": "％"}],
  ["WPSFD49207", {"up": "企業側の物価の伸び率が上がりました", "down": "企業側の物価の伸び率が下がりました", "flat": "前回と変わらず", "definition": "企業が売る商品やサービスの価格が、1年前から何％変わったかです。", "reading": "家計が払う値段とは別です。企業側の値上がりが、後で消費者の値段に影響することもあります。", "digits": 2, "unit": "％"}],
  ["UNRATE", {"up": "失業している人の割合が増えました", "down": "失業している人の割合が減りました", "flat": "前回と変わらず", "definition": "働く意思があり、仕事を探している人のうち、仕事がない人の割合です。", "reading": "数字が高いほど、仕事を探しても見つからない人の割合が多い状態です。", "digits": 2, "unit": "％"}],
  ["PAYEMS", {"up": "雇われて働く人が増えました", "down": "雇われて働く人が減りました", "flat": "前回と変わらず", "definition": "農業などを除き、雇われて働く人の総数です。単位は千人です。", "reading": "この大きな数字は、今月増えた人数ではありません。前回との差が、増えた・減った人数です。", "digits": 0, "unit": "千人"}],
  ["CES0500000003", {"up": "時給の伸び率が上がりました", "down": "時給の伸び率が下がりました", "flat": "前回と変わらず", "definition": "民間で働く人の平均時給が、1年前から何％変わったかです。", "reading": "時給そのものではなく、伸び率です。物価の伸びと比べると、買える量が増えそうか考える手がかりになります。", "digits": 2, "unit": "％"}],
  ["CIVPART", {"up": "働く・仕事を探す人の割合が増えました", "down": "働く・仕事を探す人の割合が減りました", "flat": "前回と変わらず", "definition": "16歳以上の人のうち、働いている人と仕事を探す人の割合です。", "reading": "仕事探しをやめると、この割合も失業率も下がることがあります。失業率と一緒に見ると分かりやすくなります。", "digits": 2, "unit": "％"}],
  ["U6RATE", {"up": "仕事が十分にない人の割合が増えました", "down": "仕事が十分にない人の割合が減りました", "flat": "前回と変わらず", "definition": "失業者に加え、働きたいのに仕事探しを中断した人の一部や、やむなく短時間で働く人も含めた割合です。", "reading": "普通の失業率より広く、仕事の足りなさを見ます。働きたくない人まで全員を含む数字ではありません。", "digits": 2, "unit": "％"}],
  ["ICSA", {"up": "新しく失業手当を申請する人が増えました", "down": "新しく失業手当を申請する人が減りました", "flat": "前回と変わらず", "definition": "1週間に、新しく失業手当を申請した人数です。", "reading": "毎週出るため、雇用の変化を早めに知る手がかりです。1週だけでなく、何週かの流れで見ます。", "digits": 0, "unit": "人"}],
  ["CCSA", {"up": "失業手当を受け続ける人が増えました", "down": "失業手当を受け続ける人が減りました", "flat": "前回と変わらず", "definition": "失業手当を継続して受けている人数です。", "reading": "増えると、次の仕事を見つけるまで長くかかっている可能性があります。給付終了でも減るため、減少だけで再就職とは言えません。", "digits": 0, "unit": "人"}],
  ["JTSJOL", {"up": "求人が増えました", "down": "求人が減りました", "flat": "前回と変わらず", "definition": "企業が募集している、まだ埋まっていない仕事の数です。単位は千件です。", "reading": "実際に採用された人数ではありません。企業が人をどれくらい求めているかを見ます。", "digits": 0, "unit": "千件"}],
  ["SP500", {"up": "米国の主要株が上がりました", "down": "米国の主要株が下がりました", "flat": "前回と変わらず", "definition": "米国の主要企業約500社の株価をまとめた指数です。", "reading": "すべての企業が同じ方向に動くわけではありません。ここは保存データで、CFDの価格とは別です。", "digits": 2, "unit": "指数"}],
  ["NASDAQCOM", {"up": "NASDAQの株価指数が上がりました", "down": "NASDAQの株価指数が下がりました", "flat": "前回と変わらず", "definition": "NASDAQに上場する株を幅広くまとめた指数です。", "reading": "ハイテク企業の影響を受けやすい指数です。マーケットのNASDAQ100 CFDとは、対象も価格も別です。", "digits": 2, "unit": "指数"}],
  ["DJIA", {"up": "NYダウが上がりました", "down": "NYダウが下がりました", "flat": "前回と変わらず", "definition": "米国を代表する30社の株価をまとめた指数です。", "reading": "株価の高い企業の動きが強く反映されます。米国株すべての平均ではありません。", "digits": 2, "unit": "指数"}],
  ["VIXCLS", {"up": "予想される値動きが大きくなりました", "down": "予想される値動きが小さくなりました", "flat": "前回と変わらず", "definition": "S&P500が今後約30日でどれくらい動きそうか、市場が織り込む大きさです。", "reading": "高いほど大きな値動きに備えている目安です。株が上がる・下がるの方向を予言する数字ではありません。", "digits": 2, "unit": "指数"}],
  ["NIKKEI225", {"up": "日本の主要株が上がりました", "down": "日本の主要株が下がりました", "flat": "前回と変わらず", "definition": "日本の主要225社の株価をまとめた指数です。", "reading": "株価の高い企業の動きが強く反映されます。日本株すべての平均ではなく、ここは日次の保存データです。", "digits": 2, "unit": "指数"}],
  ["CBBTCUSD", {"up": "ビットコインの価格が上がりました", "down": "ビットコインの価格が下がりました", "flat": "前回と変わらず", "definition": "1ビットコインを何米ドルで取引できるか、という価格です。", "reading": "ここはCoinbaseの価格を日次で保存した履歴です。マーケットの表示とは、データの時点が異なります。", "digits": 2, "unit": "米ドル／BTC"}],
  ["CBETHUSD", {"up": "イーサリアムの価格が上がりました", "down": "イーサリアムの価格が下がりました", "flat": "前回と変わらず", "definition": "1ETHを何米ドルで取引できるか、という価格です。", "reading": "ここはCoinbaseの価格を日次で保存した履歴です。マーケットの表示とは、データの時点が異なります。", "digits": 2, "unit": "米ドル／ETH"}],
  ["NASDAQXAU", {"up": "金・銀の鉱山株が上がりました", "down": "金・銀の鉱山株が下がりました", "flat": "前回と変わらず", "definition": "金や銀を採掘する企業の株価をまとめた指数です。", "reading": "金そのものの価格ではありません。金属価格だけでなく、企業の費用や業績にも左右されます。", "digits": 2, "unit": "指数"}],
  ["DCOILWTICO", {"up": "WTIの現物価格が上がりました", "down": "WTIの現物価格が下がりました", "flat": "前回と変わらず", "definition": "米国Cushingで取引されるWTI原油の現物価格です。単位はドル／バレルです。", "reading": "取得しているのは現物の系列です。マーケットのWTI原油CFDとは別です。", "digits": 2, "unit": "ドル／バレル"}],
  ["DHHNGSP", {"up": "天然ガスの価格が上がりました", "down": "天然ガスの価格が下がりました", "flat": "前回と変わらず", "definition": "米国Henry Hubで取引される天然ガスの現物価格です。単位はドル／百万BTUです。", "reading": "米国の天然ガスの目安です。天候や在庫に左右され、日本の家庭のガス料金そのものではありません。", "digits": 2, "unit": "ドル／百万BTU"}],
  ["GDP", {"up": "GDPの伸び率が上がりました", "down": "GDPの伸び率が下がりました", "flat": "前回と変わらず", "definition": "取得データは名目GDPの、前の四半期からの伸びを年率にした数字です。", "reading": "このペースが1年続いた場合の伸びです。物価の影響を含む数字です。", "digits": 2, "unit": "％"}],
  ["RSAFS", {"up": "売上の伸び率が上がりました", "down": "売上の伸び率が下がりました", "flat": "前回と変わらず", "definition": "小売店や飲食店などの売上が、前の月から何％変わったかです。", "reading": "プラスなら前月より売上増、マイナスなら減少です。物価の影響も含むので、買った量の変化とは限りません。", "digits": 2, "unit": "％"}],
  ["INDPRO", {"up": "工場などの生産が増えました", "down": "工場などの生産が減りました", "flat": "前回と変わらず", "definition": "工場・鉱山・電気やガスなどの生産量をまとめた指数です。", "reading": "数字が上がると生産が増えた目安です。サービス業を含む経済全体の数字ではありません。", "digits": 2, "unit": "指数"}],
  ["HOUST", {"up": "住宅の着工が増えました", "down": "住宅の着工が減りました", "flat": "前回と変わらず", "definition": "新しく建て始めた住宅の数を、1年分のペースに直した数字です。単位は千戸です。", "reading": "実際に1年間で完成した戸数ではありません。金利が住宅需要にどう影響しているかを見る手がかりです。", "digits": 0, "unit": "千戸（年率）"}],
  ["WALCL", {"up": "FRBの保有資産が増えました", "down": "FRBの保有資産が減りました", "flat": "前回と変わらず", "definition": "米国の中央銀行、FRBが持つ国債などの資産の合計です。単位は百万ドルです。", "reading": "増加を、そのまま「市中のお金が同じ額だけ増えた」とは読めません。資産の中身や他の動きも関わります。", "digits": 0, "unit": "百万ドル"}],
  ["M2SL", {"up": "預金などのお金が増えました", "down": "預金などのお金が減りました", "flat": "前回と変わらず", "definition": "現金や預金など、米国内のお金の量を広く集計した数字です。単位は十億ドルです。", "reading": "増えただけで、株価や物価が必ず上がるわけではありません。お金がどう使われるかも関わります。", "digits": 1, "unit": "十億ドル"}],
  ["UMCSENT", {"up": "消費者の気分が上向きました", "down": "消費者の気分が下向きました", "flat": "前回と変わらず", "definition": "米国の消費者が、家計や景気をどう感じているかを調べた指数です。", "reading": "高いほど見方が明るい目安です。実際に買い物が増えたかどうかは、小売売上高などで確かめます。", "digits": 1, "unit": "指数"}],
]);

export function getIndicatorReading(seriesId: string, observations: readonly Observation[]) {
  const guide = guides.get(seriesId);
  if (!guide) return null;
  // Work on a copy; never modify the saved series or the card's existing calculations.
  const valid = observations.filter(item => typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(Date.parse(`${item.date}T00:00:00Z`)) && new Date(`${item.date}T00:00:00Z`).toISOString().slice(0, 10) === item.date && typeof item.value === 'string' && item.value.trim() !== '' && Number.isFinite(Number(item.value)))
    .map(item => ({ date: item.date, value: Number(item.value) })).sort((a, b) => a.date.localeCompare(b.date));
  const latest = valid.at(-1);
  const previous = valid.at(-2);
  const direction = !latest || !previous ? '比較データがまだ足りません' : latest.value > previous.value ? guide.up : latest.value < previous.value ? guide.down : guide.flat;
  if (!latest || !previous) return { ...guide, direction, range: null };
  const start = new Date(`${latest.date}T00:00:00Z`);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  const cutoff = start.toISOString().slice(0, 10);
  const fullYear = valid[0].date <= cutoff;
  const window = valid.filter(item => item.date >= cutoff);
  if (window.length < 2) return { ...guide, direction, range: null };
  const min = Math.min(...window.map(item => item.value));
  const max = Math.max(...window.map(item => item.value));
  const position = max === min ? null : Math.max(0, Math.min(1, (latest.value - min) / (max - min)));
  const label = position === null ? 'ずっと同じ値' : position === 0 ? 'いちばん低い' : position === 1 ? 'いちばん高い' : position <= 1 / 3 ? '低め' : position >= 2 / 3 ? '高め' : '中ほど';
  return { ...guide, direction, range: { min, max, latest: latest.value, position, label, fullYear, start: fullYear ? cutoff : window[0].date, end: latest.date, count: window.length } };
}
export type IndicatorReading = NonNullable<ReturnType<typeof getIndicatorReading>>;
