import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    light: { bar: '#3B82F6', grid: '#E5E7EB', text: '#374151' },
    dark: { bar: '#60A5FA', grid: '#4B5563', text: '#D1D5DB' },
    accent: { bar: '#8B5CF6', grid: '#C4B5FD', text: '#581C87' }
  };

  const themeColors = colors[theme];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
        <XAxis 
          dataKey={xAxis} 
          stroke={themeColors.text}
          fontSize={12}
        />
        <YAxis 
          stroke={themeColors.text}
          fontSize={12}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            border: `1px solid ${themeColors.grid}`,
            borderRadius: '8px',
            color: themeColors.text
          }}
        />
        <Legend />
        <Bar 
          dataKey={yKey} 
          fill={themeColors.bar}
          radius={[4, 4, 0, 0]}
          name={normalized ? `${yAxis} (normalized)` : yAxis}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};