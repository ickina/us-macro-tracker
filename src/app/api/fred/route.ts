import { NextResponse } from 'next/server';
import { ALL_SERIES_IDS, fetchSeriesData, FredSeriesData } from '@/lib/fred';

export async function GET() {
  const results: Record<string, FredSeriesData | null> = {};
  
  try {
    const promises = ALL_SERIES_IDS.map(id => fetchSeriesData(id));
    const responses = await Promise.all(promises);
    
    responses.forEach((res, index) => {
      if (res) {
        // Reverse back to chronological order if the API returned descending (which we requested limit=120, sort_order=desc)
        // Wait, FRED API sort_order=desc returns latest first. Chart usually needs oldest first.
        // We'll reverse it here if it's from FRED, but our mock data is already chronological.
        // To be safe and consistent, we'll ensure chronological order (oldest -> newest).
        const sortedObs = [...res.observations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        res.observations = sortedObs;
        results[res.seriesId] = res;
      }
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("FRED API Route Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}
