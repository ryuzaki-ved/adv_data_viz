import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface LineChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string | string[];
  normalized?: boolean;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  const colorList = {
    light: ['#10B981', '#3B82F6', '#F59E0B'],
    dark: ['#34D399', '#60A5FA', '#FBBF24'],
    accent: ['#F59E0B', '#8B5CF6', '#3B82F6']
  };
  const themeColors = colorList[theme];

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors[0]} strokeWidth={0.5} />
          <XAxis 
            dataKey={xAxis} 
            stroke={themeColors[0]}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={themeColors[0]}
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
              color: themeColors[0],
              fontSize: '12px'
            }}
          />
          {yKeys.map((y, idx) => (
            <Line 
              key={y}
              type="monotone"
              dataKey={normalized ? `${y}_normalized` : y}
              stroke={themeColors[idx % themeColors.length]}
              strokeWidth={2}
              dot={{ fill: themeColors[idx % themeColors.length], strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: themeColors[idx % themeColors.length], strokeWidth: 2, fill: '#ffffff' }}
              name={normalized ? `${y} (normalized)` : y}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex space-x-4 mt-2 text-xs justify-center">
        {yKeys.map((y, idx) => (
          <div key={y} className="flex items-center space-x-1">
            <span style={{ background: themeColors[idx % themeColors.length], width: 12, height: 12, display: 'inline-block', borderRadius: 2 }}></span>
            <span>{normalized ? `${y} (normalized)` : y}</span>
          </div>
        ))}
      </div>
    </div>
  );
};