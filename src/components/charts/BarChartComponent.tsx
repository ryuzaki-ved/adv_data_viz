import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface BarChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  normalized?: boolean;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  
  const yKey = normalized ? `${yAxis}_normalized` : yAxis;
  
  const colors = {
    light: { bar: '#3B82F6', grid: '#F3F4F6', text: '#6B7280' },
    dark: { bar: '#60A5FA', grid: '#374151', text: '#9CA3AF' },
    accent: { bar: '#8B5CF6', grid: '#E5E7EB', text: '#6B7280' }
  };

  const themeColors = colors[theme];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} strokeWidth={0.5} />
        <XAxis 
          dataKey={xAxis} 
          stroke={themeColors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke={themeColors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: themeColors.text,
            fontSize: '12px'
          }}
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
        />
        <Bar 
          dataKey={yKey} 
          fill={themeColors.bar}
          radius={[2, 2, 0, 0]}
          name={normalized ? `${yAxis} (normalized)` : yAxis}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};