import { NextResponse } from 'next/server';
import macroData from '@/data/macroData.json';

export const dynamic = "force-static";

export async function GET() {
  const indicators = (macroData as any).indicators || {};
  return NextResponse.json({ success: true, data: indicators, updatedAt: (macroData as any).updatedAt });
}
