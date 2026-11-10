import { NextResponse } from 'next/server';
import macroData from '@/data/macroData.json';
import { MARKET_ITEMS } from '@/lib/marketCatalog';

export const dynamic = 'force-static';

export async function GET() {
  const data = Object.fromEntries(MARKET_ITEMS.flatMap(item => {
    const series = macroData.indicators[item.id];
    return series ? [[item.id, series]] : [];
  }));
  return NextResponse.json({ success: true, data, updatedAt: macroData.updatedAt });
}
