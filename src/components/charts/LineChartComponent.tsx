import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    light: { line: '#10B981', grid: '#E5E7EB', text: '#374151' },
    dark: { line: '#34D399', grid: '#4B5563', text: '#D1D5DB' },
    accent: { line: '#F59E0B', grid: '#FDE68A', text: '#92400E' }
  };

  const themeColors = colors[theme];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke={themeColors.line}
          strokeWidth={3}
          dot={{ fill: themeColors.line, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: themeColors.line, strokeWidth: 2 }}
          name={normalized ? `${yAxis} (normalized)` : yAxis}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};