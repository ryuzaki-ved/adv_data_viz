import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface PieChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string | string[];
  normalized?: boolean;
  width?: number | string;
  height?: number;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({ data, xAxis, yAxis, normalized, width = 220, height = 220 }) => {
  const { theme } = useTheme();
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  const colors = {
    light: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    dark: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE'],
    accent: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']
  };
  const themeColors = colors[theme];

  return (
    <div className="flex flex-col items-center w-full">
      <div className={`flex flex-row justify-center items-start w-full gap-8`}>
        {yKeys.map((y, idx) => {
          // Aggregate data for each pie
          const yKey = normalized ? `${y}_normalized` : y;
          const aggregatedData = data.reduce((acc, item) => {
            const category = String(item[xAxis]);
            const value = Number(item[yKey]);
            if (!acc[category]) {
              acc[category] = 0;
            }
            acc[category] += value;
            return acc;
          }, {} as Record<string, number>);
          const pieData = Object.entries(aggregatedData).map(([name, value]) => ({ name, value }));
          return (
            <div key={y} className="flex flex-col items-center">
              <ResponsiveContainer width={width} height={height}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={themeColors[i % themeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      color: theme === 'dark' ? '#fff' : '#111'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 text-xs text-gray-900 dark:text-white font-semibold">{normalized ? `${y} (normalized)` : y}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};