'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Observation } from '@/lib/fred';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Props {
  data: Observation[];
  color?: string;
}

export function LineChartComponent({ data, color = '#3b82f6' }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.map(d => ({
    date: d.date,
    value: parseFloat(d.value)
  }));

  const values = chartData.map(d => d.value).filter(v => !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1;

  const isDark = mounted ? resolvedTheme === 'dark' : true; // Default to dark before mount to avoid hydration mismatch flash

  const tooltipBg = isDark ? '#111827' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#111827';
  const tooltipLabel = isDark ? '#9ca3af' : '#6b7280';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <XAxis dataKey="date" hide />
        <YAxis domain={[min - padding, max + padding]} hide />
        <Tooltip 
          contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, fontSize: '12px' }}
          itemStyle={{ color: tooltipText }}
          labelStyle={{ color: tooltipLabel, marginBottom: '4px' }}
          formatter={(value: any) => [Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }), '値']}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
