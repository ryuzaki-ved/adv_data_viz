import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface LineChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  normalized?: boolean;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  
  const yKey = normalized ? `${yAxis}_normalized` : yAxis;
  
  const colors = {
    light: { line: '#10B981', grid: '#F3F4F6', text: '#6B7280' },
    dark: { line: '#34D399', grid: '#374151', text: '#9CA3AF' },
    accent: { line: '#F59E0B', grid: '#E5E7EB', text: '#6B7280' }
  };

  const themeColors = colors[theme];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
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
        />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke={themeColors.line}
          strokeWidth={2}
          dot={{ fill: themeColors.line, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 4, stroke: themeColors.line, strokeWidth: 2, fill: '#ffffff' }}
          name={normalized ? `${yAxis} (normalized)` : yAxis}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};