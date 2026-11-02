import { NextResponse } from 'next/server';
import macroData from '@/data/macroData.json';

export interface MacroNewsItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  points?: string[];
  source: string;
  category: 'inflation' | 'employment' | 'policy' | 'market' | 'growth';
  impact: 'High' | 'Medium' | 'Low';
  link?: string;
  badge?: string;
}

export const dynamic = 'force-static';

export async function GET() {
  const news = (macroData as any).news || [];
  return NextResponse.json({ 
    success: true, 
    data: news, 
    updatedAt: (macroData as any).updatedAt 
  });
}
