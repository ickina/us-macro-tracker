type IndicatorContext = {
  related: string;
  check: string;
};

// 「今日の変化」は41項目のどれでも選ばれるため、全項目に短い補足を用意する。
// 原因や将来を断定せず、同じ保存データ内で見比べる入口だけを示す。
const contexts = new Map<string, IndicatorContext>([
  ['DEXJPUS', { related: 'ドル指数・米2年金利', check: 'ドル全体の動きと同じ方向かを見比べます。' }],
  ['DTWEXBGS', { related: 'ドル円・ユーロドル', check: '特定の通貨だけでなく、ドル全体が動いたかを見ます。' }],
  ['DEXUSEU', { related: 'ドル指数・米2年金利', check: 'ドル全体の強さと同じ方向かを見比べます。' }],
  ['FEDFUNDS', { related: '米2年金利・コアPCE', check: '政策金利の見通しと物価の流れを一緒に見ます。' }],
  ['DGS10', { related: '10年実質金利・10年期待インフレ率', check: '実質金利と物価見通しのどちらが動いたかを見ます。' }],
  ['DGS2', { related: '実効FF金利・コアPCE', check: 'FRBの金利見通しと物価の流れを見比べます。' }],
  ['T10Y2Y', { related: '米10年金利・米2年金利', check: '長期と短期のどちらが大きく動いたかを見ます。' }],
  ['T10Y3M', { related: '米10年金利・実効FF金利', check: '長期金利と短期金利の差がどう変わったかを見ます。' }],
  ['DFII10', { related: '米10年金利・10年期待インフレ率', check: '物価の影響を除いた金利が動いたかを見ます。' }],
  ['T10YIE', { related: '米10年金利・10年実質金利', check: '金利の変化のうち、物価見通しの動きを見ます。' }],
  ['BAMLH0A0HYM2', { related: 'S&P 500・VIX', check: '企業への警戒と株式市場の不安が同時に強まったかを見ます。' }],
  ['CPIAUCSL', { related: 'コアCPI・PCEデフレーター', check: '食品・エネルギーを除いても物価の流れが同じかを見ます。' }],
  ['CPILFESL', { related: 'CPI・コアPCE', check: '一時的な値動きを除いた物価の流れを見比べます。' }],
  ['PCEPI', { related: 'コアPCE・CPI', check: 'FRBが重視する物価と身近な物価の方向を見比べます。' }],
  ['PCEPILFE', { related: 'PCEデフレーター・米2年金利', check: '物価の基調と金利見通しが同じ方向かを見ます。' }],
  ['WPSFD49207', { related: 'CPI・WTI原油', check: '企業側の価格変化が消費者物価にも広がるかを見ます。' }],
  ['UNRATE', { related: '雇用者数・労働参加率', check: '失業率の変化が、雇用や仕事探しの変化を伴うかを見ます。' }],
  ['PAYEMS', { related: '失業率・平均時給', check: '雇用の人数と賃金が同じ方向に動いたかを見ます。' }],
  ['CES0500000003', { related: 'CPI・小売売上高', check: '賃金の伸びを、物価と消費の動きに重ねて見ます。' }],
  ['CIVPART', { related: '失業率・雇用者数', check: '仕事を探す人の増減を含めて雇用の変化を見ます。' }],
  ['U6RATE', { related: '失業率・失業保険継続受給者数', check: '通常の失業率だけでは見えない仕事不足も確認します。' }],
  ['ICSA', { related: '失業保険継続受給者数・失業率', check: '1週だけでなく、申請の増減が続くかを見ます。' }],
  ['CCSA', { related: '新規失業保険申請・失業率', check: '次の仕事が見つかりにくくなっているかを見ます。' }],
  ['JTSJOL', { related: '雇用者数・平均時給', check: '企業の求人需要が採用や賃金にも表れているかを見ます。' }],
  ['SP500', { related: 'VIX・米10年金利', check: '株価の動きと、市場の不安や金利を見比べます。' }],
  ['NASDAQCOM', { related: 'S&P 500・米10年金利', check: 'ハイテク株に偏った動きか、米国株全体の動きかを見ます。' }],
  ['DJIA', { related: 'S&P 500・鉱工業生産', check: '大型株だけの動きか、景気の動きも重なるかを見ます。' }],
  ['VIXCLS', { related: 'S&P 500・ハイイールド債スプレッド', check: '株式と社債の両方で警戒が強まったかを見ます。' }],
  ['NIKKEI225', { related: 'ドル円・S&P 500', check: '為替や米国株と同じ方向に動いたかを見比べます。' }],
  ['CBBTCUSD', { related: 'イーサリアム・NASDAQ総合', check: '暗号資産全体の動きか、リスク資産全体の動きかを見ます。' }],
  ['CBETHUSD', { related: 'ビットコイン・NASDAQ総合', check: 'ETHだけの動きか、暗号資産全体の動きかを見ます。' }],
  ['NASDAQXAU', { related: '金（マーケット）・10年実質金利', check: '金属価格だけでなく、金利や鉱山会社の動きも見ます。' }],
  ['DCOILWTICO', { related: '生産者物価・CPI', check: '原油の変化が企業や家計の物価にも広がるかを見ます。' }],
  ['DHHNGSP', { related: '生産者物価・鉱工業生産', check: 'エネルギー価格と企業活動の動きを見比べます。' }],
  ['GDP', { related: '小売売上高・鉱工業生産', check: '消費と生産の両方が景気の動きを支えているかを見ます。' }],
  ['RSAFS', { related: '消費者態度・CPI', check: '消費者の気分と物価を含めて売上の変化を見ます。' }],
  ['INDPRO', { related: 'GDP・WTI原油', check: '生産の変化が景気全体やエネルギー価格と重なるかを見ます。' }],
  ['HOUST', { related: '米10年金利・米2年金利', check: '住宅の動きと借入金利の変化を見比べます。' }],
  ['WALCL', { related: 'マネーストックM2・実効FF金利', check: 'FRBの資産と金利、お金の量を分けて見ます。' }],
  ['M2SL', { related: 'FRB総資産・CPI', check: 'お金の量だけでなく、FRBの動きと物価も確認します。' }],
  ['UMCSENT', { related: '小売売上高・失業率', check: '消費者の気分が実際の買い物や雇用にも表れるかを見ます。' }],
]);

export function getIndicatorContext(seriesId: string) {
  return contexts.get(seriesId) ?? null;
}

