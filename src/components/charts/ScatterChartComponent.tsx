import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface ScatterChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string | string[];
  normalized?: boolean;
}

export const ScatterChartComponent: React.FC<ScatterChartComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  const yKeys = Array.isArray(yAxis) ? yAxis.slice(0, 3) : [yAxis];
  const colorList = {
    light: ['#EF4444', '#3B82F6', '#10B981'],
    dark: ['#F87171', '#60A5FA', '#34D399'],
    accent: ['#06B6D4', '#8B5CF6', '#3B82F6']
  };
  const themeColors = colorList[theme];

  // For each yKey, create scatter data
  const scatterDataArr = yKeys.map(y =>
    data.map(item => ({
      x: Number(item[xAxis]),
      y: Number(normalized ? item[`${y}_normalized`] : item[y])
    })).filter(item => !isNaN(item.x) && !isNaN(item.y))
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors[0]} strokeWidth={0.5} />
          <XAxis 
            type="number" 
            dataKey="x" 
            name={xAxis}
            stroke={themeColors[0]}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            stroke={themeColors[0]}
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
              color: themeColors[0],
              fontSize: '12px'
            }}
            formatter={(value, name, props) => [value, name === 'x' ? xAxis : (normalized ? `${props.payload.name} (normalized)` : props.payload.name)]}
          />
          {scatterDataArr.map((scatterData, idx) => (
            <Scatter 
              key={yKeys[idx]}
              data={scatterData} 
              fill={themeColors[idx % themeColors.length]}
              opacity={0.7}
              name={normalized ? `${yKeys[idx]} (normalized)` : yKeys[idx]}
            />
          ))}
        </ScatterChart>
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