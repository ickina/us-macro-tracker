'use client';
import { CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Observation } from '@/lib/fred';
import { sampleChartHistory } from '@/lib/chartHistory';

interface Props {
  data: Observation[];
  color?: string;
  showXAxis?: boolean;
}

export function LineChartComponent({ data, color = '#3b82f6', showXAxis = false }: Props) {
  const chartData = sampleChartHistory(data).map(d => ({
    date: d.date,
    value: parseFloat(d.value)
  }));

  const values = chartData.map(d => d.value).filter(v => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1;

  const strokeColor = color === '#22c55e' ? 'var(--chart-positive)' : color === '#ef4444' ? 'var(--chart-negative)' : 'var(--chart-accent)';

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} className="overflow-hidden">
      <LineChart data={chartData} margin={showXAxis ? { bottom: 20, left: 10, right: 10 } : {}}>
        {showXAxis && <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />}
        <XAxis 
          dataKey="date" 
          hide={!showXAxis} 
          stroke="var(--muted)"
          fontSize={12} 
          tickMargin={10} 
          minTickGap={30}
        />
        <YAxis domain={[min - padding, max + padding]} hide />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--divider)', color: 'var(--ink)', fontSize: '12px' }}
          itemStyle={{ color: 'var(--ink)' }}
          labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
          formatter={(value) => [Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }), '値']}
        />
        <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
