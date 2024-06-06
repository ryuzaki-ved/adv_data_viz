import React from 'react';
import { scaleLinear } from 'd3-scale';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface HeatmapComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  normalized?: boolean;
}

export const HeatmapComponent: React.FC<HeatmapComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  
  const yKey = normalized ? `${yAxis}_normalized` : yAxis;

  // Create a matrix for heatmap
  const xValues = [...new Set(data.map(d => String(d[xAxis])))].sort();
  const yValues = [...new Set(data.map(d => String(d[yKey])))].sort();
  
  const matrix: { x: string; y: string; value: number }[] = [];
  
  xValues.forEach(x => {
    yValues.forEach(y => {
      const matchingRows = data.filter(d => String(d[xAxis]) === x && String(d[yKey]) === y);
      const value = matchingRows.length > 0 ? Number(matchingRows[0][yKey]) : 0;
      matrix.push({ x, y, value });
    });
  });

  const values = matrix.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const colorScale = scaleLinear<string>()
    .domain([minValue, maxValue])
    .range(theme === 'dark' ? ['#1F2937', '#60A5FA'] : theme === 'accent' ? ['#FEF3C7', '#8B5CF6'] : ['#F3F4F6', '#3B82F6']);

  const cellSize = Math.min(400 / Math.max(xValues.length, yValues.length), 40);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="overflow-auto max-w-full">
        <svg 
          width={xValues.length * cellSize} 
          height={yValues.length * cellSize}
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
              <title>{`${xAxis}: ${cell.x}, ${yAxis}: ${cell.y}, Value: ${cell.value.toFixed(2)}`}</title>
            </rect>
          ))}
        </svg>
      </div>
      
      <div className="flex items-center space-x-4 text-sm">
        <span>Low</span>
        <div 
          className="w-32 h-4 rounded-full"
          style={{ 
            background: `linear-gradient(to right, ${colorScale(minValue)}, ${colorScale(maxValue)})`
          }}
        />
        <span>High</span>
      </div>
    </div>
  );
};