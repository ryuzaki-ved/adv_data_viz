import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface ScatterChartComponentProps {
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

export const ScatterChartComponent: React.FC<ScatterChartComponentProps> = ({ data, xAxis, yAxis, normalized, width = '100%', height = 350, xMin, xMax, yMin, yMax }) => {
  const { theme } = useTheme();
  const yKeys = Array.isArray(yAxis) ? yAxis.slice(0, 3) : [yAxis];
  const colorList = {
    light: ['#EF4444', '#3B82F6', '#10B981'],
    dark: ['#F87171', '#60A5FA', '#34D399'],
    accent: ['#06B6D4', '#8B5CF6', '#3B82F6']
  };
  const themeColors = colorList[theme];
  const showRightAxis = yKeys.length > 1;

  // For each yKey, create scatter data
  const scatterDataArr = yKeys.map(y =>
    data.map(item => ({
      x: Number(item[xAxis]),
      y: Number(normalized ? item[`${y}_normalized`] : item[y])
    })).filter(item => !isNaN(item.x) && !isNaN(item.y))
  );

  // Custom shape for third series
  const Triangle = (props: any) => {
    const { cx, cy, fill } = props;
    return (
      <path d={`M${cx},${cy - 6} L${cx - 6},${cy + 6} L${cx + 6},${cy + 6} Z`} fill={fill} />
    );
  };

  return (
    <div>
      <ResponsiveContainer width={width} height={height}>
        <ScatterChart margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors[0]} strokeWidth={0.5} />
          <XAxis 
            type="number" 
            dataKey="x" 
            name={xAxis}
            stroke={themeColors[0]}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={xMin !== undefined || xMax !== undefined ? [xMin ?? 'auto', xMax ?? 'auto'] : undefined}
          />
          <YAxis 
            yAxisId="left"
            type="number" 
            dataKey="y" 
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
              type="number"
              dataKey="y"
              stroke={themeColors[1]}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              label={yKeys[1] ? { value: yKeys[1], angle: 90, position: 'insideRight', fill: themeColors[1], fontSize: 12 } : undefined}
              domain={yMin !== undefined || yMax !== undefined ? [yMin ?? 'auto', yMax ?? 'auto'] : undefined}
            />
          )}
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
          {/* First scatter on left axis */}
          {yKeys[0] && (
            <Scatter 
              key={yKeys[0]}
              data={scatterDataArr[0]} 
              fill={themeColors[0]}
              opacity={0.7}
              name={normalized ? `${yKeys[0]} (normalized)` : yKeys[0]}
              yAxisId="left"
            />
          )}
          {/* Second scatter on right axis if present */}
          {yKeys[1] && (
            <Scatter 
              key={yKeys[1]}
              data={scatterDataArr[1]} 
              fill={themeColors[1]}
              opacity={0.7}
              name={normalized ? `${yKeys[1]} (normalized)` : yKeys[1]}
              yAxisId="right"
            />
          )}
          {/* Third as triangle on left axis for clarity */}
          {yKeys[2] && (
            <Scatter 
              key={yKeys[2]}
              data={scatterDataArr[2]} 
              fill={themeColors[2]}
              opacity={0.7}
              name={normalized ? `${yKeys[2]} (normalized)` : yKeys[2]}
              shape={<Triangle />}
              yAxisId="left"
            />
          )}
        </ScatterChart>
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