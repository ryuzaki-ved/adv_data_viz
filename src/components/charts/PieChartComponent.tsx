import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface PieChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  normalized?: boolean;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  
  const yKey = normalized ? `${yAxis}_normalized` : yAxis;

  // Aggregate data for pie chart
  const aggregatedData = data.reduce((acc, item) => {
    const category = String(item[xAxis]);
    const value = Number(item[yKey]);
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += value;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(aggregatedData).map(([name, value]) => ({
    name,
    value
  }));

  const colors = {
    light: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
    dark: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#A3E635', '#FB923C'],
    accent: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316']
  };

  const themeColors = colors[theme];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={themeColors[index % themeColors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
            borderRadius: '8px',
            color: theme === 'dark' ? '#D1D5DB' : '#374151'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};