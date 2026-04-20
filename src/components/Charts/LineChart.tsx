'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Observation } from '@/lib/fred';

interface Props {
  data: Observation[];
  color?: string;
}

export function LineChartComponent({ data, color = '#3b82f6' }: Props) {
  const chartData = data.map(d => ({
    date: d.date,
    value: parseFloat(d.value)
  }));

  const values = chartData.map(d => d.value).filter(v => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <XAxis dataKey="date" hide />
        <YAxis domain={[min - padding, max + padding]} hide />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6', fontSize: '12px' }}
          itemStyle={{ color: '#f3f4f6' }}
          labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
          formatter={(value: any) => [Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }), '値']}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
