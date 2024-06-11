import React, { useState, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
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

export const ScatterChartComponent: React.FC<ScatterChartComponentProps> = ({ 
  data, xAxis, yAxis, normalized, width = '100%', height = 350, xMin, xMax, yMin, yMax 
}) => {
  const { theme } = useTheme();
  const [zoomDomain, setZoomDomain] = useState<{ x?: [number, number]; y?: [number, number] }>({});
  const [showBrush, setShowBrush] = useState(data.length > 100);
  const chartRef = useRef<any>(null);
  
  const yKeys = Array.isArray(yAxis) ? yAxis.slice(0, 3) : [yAxis];
  const colorList = {
    light: ['#EF4444', '#3B82F6', '#10B981'],
    dark: ['#F87171', '#60A5FA', '#34D399'],
    accent: ['#06B6D4', '#8B5CF6', '#3B82F6']
  };
  const themeColors = colorList[theme];
  const showRightAxis = yKeys.length > 1;

  // Optimize data for large datasets with intelligent sampling
  const optimizedData = React.useMemo(() => {
    if (data.length <= 2000) return data;
    
    // Use stratified sampling to preserve data distribution
    const sampleSize = 2000;
    const step = Math.ceil(data.length / sampleSize);
    const sampled = [];
    
    // Sort data by x-axis for better distribution
    const sortedData = [...data].sort((a, b) => {
      const aVal = Number(a[xAxis]);
      const bVal = Number(b[xAxis]);
      return aVal - bVal;
    });
    
    for (let i = 0; i < sortedData.length; i += step) {
      sampled.push(sortedData[i]);
    }
    
    return sampled;
  }, [data, xAxis]);

  // For each yKey, create scatter data
  const scatterDataArr = yKeys.map(y =>
    optimizedData.map(item => ({
      x: Number(item[xAxis]),
      y: Number(normalized ? item[`${y}_normalized`] : item[y]),
      originalData: item
    })).filter(item => !isNaN(item.x) && !isNaN(item.y))
  );

  const handleZoomIn = () => {
    const allXValues = scatterDataArr.flat().map(d => d.x);
    const allYValues = scatterDataArr.flat().map(d => d.y);
    
    const currentXDomain = zoomDomain.x || [Math.min(...allXValues), Math.max(...allXValues)];
    const currentYDomain = zoomDomain.y || [Math.min(...allYValues), Math.max(...allYValues)];
    
    const xCenter = (currentXDomain[0] + currentXDomain[1]) / 2;
    const yCenter = (currentYDomain[0] + currentYDomain[1]) / 2;
    const xRange = (currentXDomain[1] - currentXDomain[0]) * 0.5;
    const yRange = (currentYDomain[1] - currentYDomain[0]) * 0.5;
    
    setZoomDomain({
      x: [xCenter - xRange / 2, xCenter + xRange / 2],
      y: [yCenter - yRange / 2, yCenter + yRange / 2]
    });
  };

  const handleZoomOut = () => {
    const allXValues = scatterDataArr.flat().map(d => d.x);
    const allYValues = scatterDataArr.flat().map(d => d.y);
    
    const currentXDomain = zoomDomain.x || [Math.min(...allXValues), Math.max(...allXValues)];
    const currentYDomain = zoomDomain.y || [Math.min(...allYValues), Math.max(...allYValues)];
    
    const xCenter = (currentXDomain[0] + currentXDomain[1]) / 2;
    const yCenter = (currentYDomain[0] + currentYDomain[1]) / 2;
    const xRange = Math.min((currentXDomain[1] - currentXDomain[0]) * 2, Math.max(...allXValues) - Math.min(...allXValues));
    const yRange = Math.min((currentYDomain[1] - currentYDomain[0]) * 2, Math.max(...allYValues) - Math.min(...allYValues));
    
    setZoomDomain({
      x: [xCenter - xRange / 2, xCenter + xRange / 2],
      y: [yCenter - yRange / 2, yCenter + yRange / 2]
    });
  };

  const handleResetZoom = () => {
    setZoomDomain({});
  };

  // Custom shape for third series
  const Triangle = (props: any) => {
    const { cx, cy, fill } = props;
    return (
      <path d={`M${cx},${cy - 6} L${cx - 6},${cy + 6} L${cx + 6},${cy + 6} Z`} fill={fill} />
    );
  };

  // Custom tooltip for better performance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <p className="font-medium mb-1">{`${xAxis}: ${data.x?.toFixed(2)}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value?.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Chart Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

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
            domain={zoomDomain.x || (xMin !== undefined || xMax !== undefined ? [xMin ?? 'dataMin', xMax ?? 'dataMax'] : ['dataMin', 'dataMax'])}
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
            domain={zoomDomain.y || (yMin !== undefined || yMax !== undefined ? [yMin ?? 'dataMin', yMax ?? 'dataMax'] : ['dataMin', 'dataMax'])}
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
              domain={zoomDomain.y || (yMin !== undefined || yMax !== undefined ? [yMin ?? 'dataMin', yMax ?? 'dataMax'] : ['dataMin', 'dataMax'])}
            />
          )}
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
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
        {optimizedData.length < data.length && (
          <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
            Showing {optimizedData.length} of {data.length} points
          </div>
        )}
      </div>
    </div>
  );
};