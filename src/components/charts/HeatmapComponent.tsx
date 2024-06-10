import React from 'react';
import { scaleLinear } from 'd3-scale';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface HeatmapComponentProps {
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

export const HeatmapComponent: React.FC<HeatmapComponentProps> = ({ data, xAxis, yAxis, normalized, width = 300, height = 300, xMin, xMax, yMin, yMax }) => {
  const { theme } = useTheme();
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];

  return (
    <div className="flex flex-row justify-center items-start w-full gap-8">
      {yKeys.map((y, idx) => {
        const yKey = normalized ? `${y}_normalized` : y;
        // Create a matrix for heatmap
        const xValues = [...new Set(data.map(d => String(d[xAxis])))].sort();
        const yValues = [...new Set(data.map(d => String(d[yKey])))].sort();
        const matrix: { x: string; y: string; value: number }[] = [];
        xValues.forEach(x => {
          yValues.forEach(yv => {
            const matchingRows = data.filter(d => String(d[xAxis]) === x && String(d[yKey]) === yv);
            const value = matchingRows.length > 0 ? Number(matchingRows[0][yKey]) : 0;
            matrix.push({ x, y: yv, value });
          });
        });
        const values = matrix.map(d => d.value);
        const minValue = yMin !== undefined ? yMin : Math.min(...values);
        const maxValue = yMax !== undefined ? yMax : Math.max(...values);
        const colorScale = scaleLinear<string>()
          .domain([minValue, maxValue])
          .range(theme === 'dark' ? ['#1F2937', '#60A5FA'] : theme === 'accent' ? ['#FEF3C7', '#8B5CF6'] : ['#F9FAFB', '#3B82F6']);
        const cellSize = Math.min((typeof width === 'number' ? width : 300) / Math.max(xValues.length, yValues.length), 30);
        return (
          <div key={y} className="flex flex-col items-center">
            <div className="overflow-auto max-w-full">
              <svg 
                width={typeof width === 'number' ? width : 300} 
                height={typeof height === 'number' ? height : 300}
                className="border rounded-lg"
              >
                {matrix.map((cell, index) => (
                  <rect
                    key={index}
                    x={xValues.indexOf(cell.x) * cellSize}
                    y={yValues.indexOf(cell.y) * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={colorScale(cell.value)}
                    stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
                    strokeWidth={0.5}
                  >
                    <title>{`${xAxis}: ${cell.x}, ${y}: ${cell.y}, Value: ${cell.value.toFixed(2)}`}</title>
                  </rect>
                ))}
              </svg>
            </div>
            <div className="flex items-center space-x-3 text-xs opacity-70 mt-2">
              <span className="text-gray-900 dark:text-white">Low</span>
              <div 
                className="w-24 h-3 rounded-full"
                style={{ 
                  background: `linear-gradient(to right, ${colorScale(minValue)}, ${colorScale(maxValue)})`
                }}
              />
              <span className="text-gray-900 dark:text-white">High</span>
            </div>
            <div className="mt-2 text-xs text-gray-900 dark:text-white font-semibold">{normalized ? `${y} (normalized)` : y}</div>
          </div>
        );
      })}
    </div>
  );
};