import React from 'react';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface FootprintComponentProps {
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

export const FootprintComponent: React.FC<FootprintComponentProps> = ({ data, xAxis, yAxis, normalized, width = 500, height = 400, xMin, xMax, yMin, yMax }) => {
  const { theme } = useTheme();
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  const colors = {
    light: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    dark: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
    accent: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  };
  const themeColors = colors[theme];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
        {yKeys.map((y, idx) => {
          const yKey = normalized ? `${y}_normalized` : y;
          // Calculate bubble sizes based on values
          const values = data.map(d => Number(d[yKey])).filter(v => !isNaN(v));
          const minValue = yMin !== undefined ? yMin : Math.min(...values);
          const maxValue = yMax !== undefined ? yMax : Math.max(...values);
          const range = maxValue - minValue;
          
          // Create a grid-based layout for better spacing
          const gridSize = Math.ceil(Math.sqrt(data.length));
          const cellWidth = (typeof width === 'number' ? width : 500) / gridSize;
          const cellHeight = (typeof height === 'number' ? height : 400) / gridSize;
          
          const bubbles = data.map((item, index) => {
            const value = Number(item[yKey]);
            const normalizedSize = range > 0 ? (value - minValue) / range : 0.5;
            const size = 20 + normalizedSize * 60; // Size between 20 and 80
            
            // Grid positioning with some randomness
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            const baseX = col * cellWidth + cellWidth / 2;
            const baseY = row * cellHeight + cellHeight / 2;
            const randomOffsetX = (Math.random() - 0.5) * (cellWidth * 0.3);
            const randomOffsetY = (Math.random() - 0.5) * (cellHeight * 0.3);
            
            return {
              id: index,
              x: Math.max(size/2, Math.min((typeof width === 'number' ? width : 500) - size/2, baseX + randomOffsetX)),
              y: Math.max(size/2, Math.min((typeof height === 'number' ? height : 400) - size/2, baseY + randomOffsetY)),
              size,
              value,
              label: String(item[xAxis])
            };
          });
          
          return (
            <div key={y} className="flex flex-col items-center">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <svg 
                  width={typeof width === 'number' ? width : 500} 
                  height={typeof height === 'number' ? height : 400} 
                  className="rounded-lg"
                  style={{ backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB' }}
                >
                  {bubbles.map((bubble, index) => (
                    <g key={bubble.id}>
                      <circle
                        cx={bubble.x}
                        cy={bubble.y}
                        r={bubble.size / 2}
                        fill={themeColors[index % themeColors.length]}
                        opacity={0.8}
                        stroke={theme === 'dark' ? '#FFFFFF' : '#374151'}
                        strokeWidth={1}
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <title>{`${bubble.label}: ${bubble.value.toFixed(2)}`}</title>
                      </circle>
                      <text
                        x={bubble.x}
                        y={bubble.y}
                        textAnchor="middle"
                        dy="0.3em"
                        fontSize="11"
                        fill={theme === 'dark' ? '#FFFFFF' : '#374151'}
                        fontWeight="600"
                        className="pointer-events-none"
                      >
                        {bubble.label.length > 8 ? `${bubble.label.substring(0, 8)}...` : bubble.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {normalized ? `${y} (normalized)` : y}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Bubble size represents values
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};