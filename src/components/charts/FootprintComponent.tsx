import React from 'react';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface FootprintComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string;
  normalized?: boolean;
}

export const FootprintComponent: React.FC<FootprintComponentProps> = ({ data, xAxis, yAxis, normalized }) => {
  const { theme } = useTheme();
  
  const yKey = normalized ? `${yAxis}_normalized` : yAxis;

  // Calculate bubble sizes based on values
  const values = data.map(d => Number(d[yKey])).filter(v => !isNaN(v));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  const bubbles = data.map((item, index) => {
    const value = Number(item[yKey]);
    const normalizedSize = range > 0 ? (value - minValue) / range : 0.5;
    const size = 15 + normalizedSize * 40; // Size between 15 and 55
    
    return {
      id: index,
      x: 50 + (Math.random() - 0.5) * 250, // Random positioning
      y: 50 + (Math.random() - 0.5) * 150,
      size,
      value,
      label: String(item[xAxis])
    };
  });

  const colors = {
    light: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    dark: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
    accent: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  };

  const themeColors = colors[theme];

  return (
    <div className="flex flex-col items-center">
      <svg width="400" height="300" className="border rounded-lg bg-opacity-5">
        {bubbles.map((bubble, index) => (
          <g key={bubble.id}>
            <circle
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.size / 2}
              fill={themeColors[index % themeColors.length]}
              opacity={0.7}
              stroke={themeColors[index % themeColors.length]}
              strokeWidth={1}
            >
              <title>{`${bubble.label}: ${bubble.value.toFixed(2)}`}</title>
            </circle>
            <text
              x={bubble.x}
              y={bubble.y}
              textAnchor="middle"
              dy="0.3em"
              fontSize="10"
              fill={theme === 'dark' ? '#D1D5DB' : '#374151'}
              fontWeight="500"
            >
              {bubble.label.length > 6 ? `${bubble.label.substring(0, 6)}...` : bubble.label}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="mt-3 text-xs text-center opacity-60">
        Bubble size represents {normalized ? `${yAxis} (normalized)` : yAxis} values
      </div>
    </div>
  );
};