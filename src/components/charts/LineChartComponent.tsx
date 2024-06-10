import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface LineChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string | string[];
  normalized?: boolean;
  width?: number | string;
  height?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({ data, xAxis, yAxis, normalized, width = '100%', height = 350, xMin, xMax, yMin, yMax }) => {
  const { theme } = useTheme();
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  const colorList = {
    light: ['#10B981', '#3B82F6', '#F59E0B'],
    dark: ['#34D399', '#60A5FA', '#FBBF24'],
    accent: ['#F59E0B', '#8B5CF6', '#3B82F6']
  };
  const themeColors = colorList[theme];
  const showRightAxis = yKeys.length > 1;

  return (
    <div>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={data} margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors[0]} strokeWidth={0.5} />
          <XAxis 
            dataKey={xAxis} 
            stroke={themeColors[0]}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={xMin !== undefined || xMax !== undefined ? [xMin ?? 'auto', xMax ?? 'auto'] : undefined}
            type={typeof data[0]?.[xAxis] === 'number' ? 'number' : 'category'}
          />
          <YAxis 
            yAxisId="left"
            stroke={themeColors[0]}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={yKeys[0] ? { value: yKeys[0], angle: -90, position: 'insideLeft', fill: themeColors[0], fontSize: 12 } : undefined}
            domain={yMin !== undefined || yMax !== undefined ? [yMin ?? 'auto', yMax ?? 'auto'] : undefined}
          />
          {showRightAxis && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={themeColors[1]}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              label={yKeys[1] ? { value: yKeys[1], angle: 90, position: 'insideRight', fill: themeColors[1], fontSize: 12 } : undefined}
              domain={yMin !== undefined || yMax !== undefined ? [yMin ?? 'auto', yMax ?? 'auto'] : undefined}
            />
          )}
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
          {/* First line on left axis */}
          {yKeys[0] && (
            <Line 
              key={yKeys[0]}
              type="monotone"
              dataKey={normalized ? `${yKeys[0]}_normalized` : yKeys[0]}
              stroke={themeColors[0]}
              strokeWidth={2}
              dot={{ fill: themeColors[0], strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: themeColors[0], strokeWidth: 2, fill: '#ffffff' }}
              name={normalized ? `${yKeys[0]} (normalized)` : yKeys[0]}
              yAxisId="left"
            />
          )}
          {/* Second line on right axis if present */}
          {yKeys[1] && (
            <Line 
              key={yKeys[1]}
              type="monotone"
              dataKey={normalized ? `${yKeys[1]}_normalized` : yKeys[1]}
              stroke={themeColors[1]}
              strokeWidth={2}
              dot={{ fill: themeColors[1], strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: themeColors[1], strokeWidth: 2, fill: '#ffffff' }}
              name={normalized ? `${yKeys[1]} (normalized)` : yKeys[1]}
              yAxisId="right"
            />
          )}
          {/* Third as dashed line on left axis for clarity */}
          {yKeys[2] && (
            <Line 
              key={yKeys[2]}
              type="monotone"
              dataKey={normalized ? `${yKeys[2]}_normalized` : yKeys[2]}
              stroke={themeColors[2]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: themeColors[2], strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: themeColors[2], strokeWidth: 2, fill: '#ffffff' }}
              name={normalized ? `${yKeys[2]} (normalized)` : yKeys[2]}
              yAxisId="left"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex space-x-4 mt-2 text-xs justify-center">
        {yKeys.map((y, idx) => (
          <div key={y} className="flex items-center space-x-1">
            <span style={{ background: themeColors[idx % themeColors.length], width: 12, height: 12, display: 'inline-block', borderRadius: 2 }}></span>
            <span className="text-gray-900 dark:text-white">{normalized ? `${y} (normalized)` : y}</span>
          </div>
        ))}
      </div>
    </div>
  );
};