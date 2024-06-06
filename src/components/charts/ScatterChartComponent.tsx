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
    light: { scatter: '#EF4444', grid: '#E5E7EB', text: '#374151' },
    dark: { scatter: '#F87171', grid: '#4B5563', text: '#D1D5DB' },
    accent: { scatter: '#06B6D4', grid: '#A7F3D0', text: '#065F46' }
  };

  const themeColors = colors[theme];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
        <XAxis 
          type="number" 
          dataKey="x" 
          name={xAxis}
          stroke={themeColors.text}
          fontSize={12}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name={normalized ? `${yAxis} (normalized)` : yAxis}
          stroke={themeColors.text}
          fontSize={12}
        />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            border: `1px solid ${themeColors.grid}`,
            borderRadius: '8px',
            color: themeColors.text
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