import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
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

export const LineChartComponent: React.FC<LineChartComponentProps> = ({ 
  data, xAxis, yAxis, normalized, width = '100%', height = 350, xMin, xMax, yMin, yMax 
}) => {
  const { theme } = useTheme();
  const [zoomDomain, setZoomDomain] = useState<{ left?: number; right?: number }>({});
  const [brushDomain, setBrushDomain] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [showBrush, setShowBrush] = useState(data.length > 50);
  const chartRef = useRef<any>(null);
  
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  const colorList = {
    light: ['#10B981', '#3B82F6', '#F59E0B'],
    dark: ['#34D399', '#60A5FA', '#FBBF24'],
    accent: ['#F59E0B', '#8B5CF6', '#3B82F6']
  };
  const themeColors = colorList[theme];
  const showRightAxis = yKeys.length > 1;

  // Optimize data for large datasets
  const optimizedData = React.useMemo(() => {
    if (data.length <= 1000) return data;
    
    // Use more sophisticated sampling for line charts to preserve trends
    const step = Math.ceil(data.length / 1000);
    const sampled = [];
    
    // Always include first and last points
    sampled.push(data[0]);
    
    for (let i = step; i < data.length - step; i += step) {
      sampled.push(data[i]);
    }
    
    sampled.push(data[data.length - 1]);
    return sampled;
  }, [data]);

  const handleZoomIn = () => {
    const currentDomain = zoomDomain;
    const dataLength = optimizedData.length;
    const left = currentDomain.left || 0;
    const right = currentDomain.right || dataLength - 1;
    const center = (left + right) / 2;
    const newRange = (right - left) * 0.5;
    
    setZoomDomain({
      left: Math.max(0, center - newRange / 2),
      right: Math.min(dataLength - 1, center + newRange / 2)
    });
  };

  const handleZoomOut = () => {
    const currentDomain = zoomDomain;
    const dataLength = optimizedData.length;
    const left = currentDomain.left || 0;
    const right = currentDomain.right || dataLength - 1;
    const center = (left + right) / 2;
    const newRange = Math.min((right - left) * 2, dataLength);
    
    setZoomDomain({
      left: Math.max(0, center - newRange / 2),
      right: Math.min(dataLength - 1, center + newRange / 2)
    });
  };

  const handleResetZoom = () => {
    setZoomDomain({});
    setBrushDomain({});
  };

  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setBrushDomain({
        startIndex: brushData.startIndex,
        endIndex: brushData.endIndex
      });
      setZoomDomain({
        left: brushData.startIndex,
        right: brushData.endIndex
      });
    }
  };

  // Custom tooltip for better performance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <p className="font-medium mb-1">{`${xAxis}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
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
        <button
          onClick={() => setShowBrush(!showBrush)}
          className={`p-1.5 rounded transition-colors ${
            showBrush 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Toggle Brush"
        >
          <Move className="h-4 w-4" />
        </button>
      </div>

      <ResponsiveContainer width={width} height={height}>
        <LineChart 
          ref={chartRef}
          data={optimizedData} 
          margin={{ top: 10, right: 40, left: 10, bottom: showBrush ? 60 : 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors[0]} strokeWidth={0.5} />
          <XAxis 
            dataKey={xAxis} 
            stroke={themeColors[0]}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={zoomDomain.left !== undefined ? [zoomDomain.left, zoomDomain.right] : (xMin !== undefined || xMax !== undefined ? [xMin ?? 'dataMin', xMax ?? 'dataMax'] : undefined)}
            type={typeof optimizedData[0]?.[xAxis] === 'number' ? 'number' : 'category'}
            interval={optimizedData.length > 100 ? 'preserveStartEnd' : 0}
          />
          <YAxis 
            yAxisId="left"
            stroke={themeColors[0]}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={yKeys[0] ? { value: yKeys[0], angle: -90, position: 'insideLeft', fill: themeColors[0], fontSize: 12 } : undefined}
            domain={yMin !== undefined || yMax !== undefined ? [yMin ?? 'dataMin', yMax ?? 'dataMax'] : undefined}
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
              domain={yMin !== undefined || yMax !== undefined ? [yMin ?? 'dataMin', yMax ?? 'dataMax'] : undefined}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          
          {/* First line on left axis */}
          {yKeys[0] && (
            <Line 
              key={yKeys[0]}
              type="monotone"
              dataKey={normalized ? `${yKeys[0]}_normalized` : yKeys[0]}
              stroke={themeColors[0]}
              strokeWidth={2}
              dot={optimizedData.length > 100 ? false : { fill: themeColors[0], strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: themeColors[0], strokeWidth: 2, fill: '#ffffff' }}
              name={normalized ? `${yKeys[0]} (normalized)` : yKeys[0]}
              yAxisId="left"
              connectNulls={false}
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
              dot={optimizedData.length > 100 ? false : { fill: themeColors[1], strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: themeColors[1], strokeWidth: 2, fill: '#ffffff' }}
              name={normalized ? `${yKeys[1]} (normalized)` : yKeys[1]}
              yAxisId="right"
              connectNulls={false}
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
              dot={optimizedData.length > 100 ? false : { fill: themeColors[2], strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: themeColors[2], strokeWidth: 2, fill: '#ffffff' }}
              name={normalized ? `${yKeys[2]} (normalized)` : yKeys[2]}
              yAxisId="left"
              connectNulls={false}
            />
          )}
          
          {/* Brush for navigation */}
          {showBrush && (
            <Brush
              dataKey={xAxis}
              height={30}
              stroke={themeColors[0]}
              fill={theme === 'dark' ? '#374151' : '#F3F4F6'}
              onChange={handleBrushChange}
              startIndex={brushDomain.startIndex}
              endIndex={brushDomain.endIndex}
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
        {optimizedData.length < data.length && (
          <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
            Showing {optimizedData.length} of {data.length} points
          </div>
        )}
      </div>
    </div>
  );
};