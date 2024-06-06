import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface ScatterChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  normalized?: boolean;
}

export const ScatterChartComponent: React.FC<ScatterChartComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  
  const yKey = normalized ? `${yAxis}_normalized` : yAxis;
  
  const scatterData = data.map(item => ({
    x: Number(item[xAxis]),
    y: Number(item[yKey])
  })).filter(item => !isNaN(item.x) && !isNaN(item.y));

  const colors = {
    light: { scatter: '#EF4444', grid: '#F3F4F6', text: '#6B7280' },
    dark: { scatter: '#F87171', grid: '#374151', text: '#9CA3AF' },
    accent: { scatter: '#06B6D4', grid: '#E5E7EB', text: '#6B7280' }
  };

  const themeColors = colors[theme];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} strokeWidth={0.5} />
        <XAxis 
          type="number" 
          dataKey="x" 
          name={xAxis}
          stroke={themeColors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name={normalized ? `${yAxis} (normalized)` : yAxis}
          stroke={themeColors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: themeColors.text,
            fontSize: '12px'
          }}
          formatter={(value, name) => [value, name === 'x' ? xAxis : (normalized ? `${yAxis} (normalized)` : yAxis)]}
        />
        <Scatter 
          data={scatterData} 
          fill={themeColors.scatter}
          opacity={0.7}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
};