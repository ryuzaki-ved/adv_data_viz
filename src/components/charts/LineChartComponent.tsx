import React, { useState, useRef, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine, Legend, Area, ComposedChart } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Move, Download, TrendingUp, Activity, Eye, EyeOff } from 'lucide-react';
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
  const [showGrid, setShowGrid] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showArea, setShowArea] = useState(false);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const chartRef = useRef<any>(null);
  
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  
  // Initialize visible lines
  React.useEffect(() => {
    setVisibleLines(new Set(yKeys));
  }, [yKeys]);

  // Enhanced color system with better contrast
  const colorSystem = {
    light: {
      lines: ['#2563EB', '#059669', '#DC2626', '#7C3AED', '#EA580C'],
      areas: ['rgba(37, 99, 235, 0.1)', 'rgba(5, 150, 105, 0.1)', 'rgba(220, 38, 38, 0.1)', 'rgba(124, 58, 237, 0.1)', 'rgba(234, 88, 12, 0.1)'],
      dots: ['#1D4ED8', '#047857', '#B91C1C', '#6D28D9', '#C2410C']
    },
    dark: {
      lines: ['#60A5FA', '#34D399', '#F87171', '#A78BFA', '#FB923C'],
      areas: ['rgba(96, 165, 250, 0.15)', 'rgba(52, 211, 153, 0.15)', 'rgba(248, 113, 113, 0.15)', 'rgba(167, 139, 250, 0.15)', 'rgba(251, 146, 60, 0.15)'],
      dots: ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F97316']
    },
    accent: {
      lines: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
      areas: ['rgba(139, 92, 246, 0.12)', 'rgba(6, 182, 212, 0.12)', 'rgba(16, 185, 129, 0.12)', 'rgba(245, 158, 11, 0.12)', 'rgba(239, 68, 68, 0.12)'],
      dots: ['#7C3AED', '#0891B2', '#059669', '#D97706', '#DC2626']
    }
  };
  
  const currentColors = colorSystem[theme];
  const showRightAxis = yKeys.length > 1;

  // Advanced data optimization with trend analysis
  const optimizedData = useMemo(() => {
    if (data.length <= 2000) return data;
    
    // Implement Douglas-Peucker algorithm for line simplification
    const douglasPeucker = (points: DataPoint[], epsilon: number): DataPoint[] => {
      if (points.length <= 2) return points;
      
      let dmax = 0;
      let index = 0;
      const end = points.length - 1;
      
      for (let i = 1; i < end; i++) {
        const d = perpendicularDistance(points[i], points[0], points[end]);
        if (d > dmax) {
          index = i;
          dmax = d;
        }
      }
      
      if (dmax > epsilon) {
        const recResults1 = douglasPeucker(points.slice(0, index + 1), epsilon);
        const recResults2 = douglasPeucker(points.slice(index), epsilon);
        
        return [...recResults1.slice(0, -1), ...recResults2];
      } else {
        return [points[0], points[end]];
      }
    };
    
    const perpendicularDistance = (point: DataPoint, lineStart: DataPoint, lineEnd: DataPoint): number => {
      const x0 = Number(point[xAxis]);
      const y0 = Number(point[yKeys[0]]);
      const x1 = Number(lineStart[xAxis]);
      const y1 = Number(lineStart[yKeys[0]]);
      const x2 = Number(lineEnd[xAxis]);
      const y2 = Number(lineEnd[yKeys[0]]);
      
      const A = x0 - x1;
      const B = y0 - y1;
      const C = x2 - x1;
      const D = y2 - y1;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) return Math.sqrt(A * A + B * B);
      
      const param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }
      
      const dx = x0 - xx;
      const dy = y0 - yy;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Calculate appropriate epsilon based on data range
    const yValues = data.map(d => Number(d[yKeys[0]])).filter(v => !isNaN(v));
    const yRange = Math.max(...yValues) - Math.min(...yValues);
    const epsilon = yRange * 0.001; // 0.1% of range
    
    return douglasPeucker(data, epsilon).slice(0, 2000);
  }, [data, xAxis, yKeys]);

  // Enhanced data ranges with statistical analysis
  const dataRanges = useMemo(() => {
    const xValues = optimizedData.map(d => {
      const val = d[xAxis];
      return typeof val === 'number' ? val : parseFloat(String(val));
    }).filter(v => !isNaN(v));

    const yValues = yKeys.flatMap(key => 
      optimizedData.map(d => {
        const val = normalized ? d[`${key}_normalized`] : d[key];
        return typeof val === 'number' ? val : parseFloat(String(val));
      }).filter(v => !isNaN(v))
    );

    const xRange = xValues.length > 0 ? {
      min: Math.min(...xValues),
      max: Math.max(...xValues),
      mean: xValues.reduce((a, b) => a + b, 0) / xValues.length
    } : { min: 0, max: 100, mean: 50 };

    const yRange = yValues.length > 0 ? {
      min: Math.min(...yValues),
      max: Math.max(...yValues),
      mean: yValues.reduce((a, b) => a + b, 0) / yValues.length
    } : { min: 0, max: 100, mean: 50 };

    // Adaptive padding based on data variance
    const xPadding = (xRange.max - xRange.min) * 0.02;
    const yPadding = (yRange.max - yRange.min) * 0.05;

    return {
      x: {
        min: xRange.min - xPadding,
        max: xRange.max + xPadding,
        dataMin: xRange.min,
        dataMax: xRange.max,
        mean: xRange.mean
      },
      y: {
        min: yRange.min - yPadding,
        max: yRange.max + yPadding,
        dataMin: yRange.min,
        dataMax: yRange.max,
        mean: yRange.mean
      }
    };
  }, [optimizedData, xAxis, yKeys, normalized]);

  // Enhanced domain calculations
  const getXDomain = useCallback(() => {
    if (zoomDomain.left !== undefined && zoomDomain.right !== undefined) {
      return [zoomDomain.left, zoomDomain.right];
    }
    if (xMin !== undefined || xMax !== undefined) {
      const min = xMin !== undefined ? xMin : dataRanges.x.min;
      const max = xMax !== undefined ? xMax : dataRanges.x.max;
      return [min, max];
    }
    return [dataRanges.x.min, dataRanges.x.max];
  }, [zoomDomain, xMin, xMax, dataRanges]);

  const getYDomain = useCallback(() => {
    if (yMin !== undefined || yMax !== undefined) {
      const min = yMin !== undefined ? yMin : dataRanges.y.min;
      const max = yMax !== undefined ? yMax : dataRanges.y.max;
      return [min, max];
    }
    return [dataRanges.y.min, dataRanges.y.max];
  }, [yMin, yMax, dataRanges]);

  // Smooth zoom controls
  const handleZoomIn = useCallback(() => {
    const currentDomain = zoomDomain;
    const dataLength = optimizedData.length;
    const left = currentDomain.left || 0;
    const right = currentDomain.right || dataLength - 1;
    const center = (left + right) / 2;
    const newRange = (right - left) * 0.7;
    
    setZoomDomain({
      left: Math.max(0, center - newRange / 2),
      right: Math.min(dataLength - 1, center + newRange / 2)
    });
  }, [zoomDomain, optimizedData.length]);

  const handleZoomOut = useCallback(() => {
    const currentDomain = zoomDomain;
    const dataLength = optimizedData.length;
    const left = currentDomain.left || 0;
    const right = currentDomain.right || dataLength - 1;
    const center = (left + right) / 2;
    const newRange = Math.min((right - left) * 1.5, dataLength);
    
    setZoomDomain({
      left: Math.max(0, center - newRange / 2),
      right: Math.min(dataLength - 1, center + newRange / 2)
    });
  }, [zoomDomain, optimizedData.length]);

  const handleResetZoom = useCallback(() => {
    setZoomDomain({});
    setBrushDomain({});
  }, []);

  const handleBrushChange = useCallback((brushData: any) => {
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
  }, []);

  // Line visibility toggle
  const toggleLineVisibility = useCallback((lineKey: string) => {
    const newVisible = new Set(visibleLines);
    if (newVisible.has(lineKey)) {
      newVisible.delete(lineKey);
    } else {
      newVisible.add(lineKey);
    }
    setVisibleLines(newVisible);
  }, [visibleLines]);

  // Export functionality
  const handleExport = useCallback(() => {
    if (chartRef.current) {
      const svg = chartRef.current.container.querySelector('svg');
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = 'line-chart.png';
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }, []);

  // Enhanced tooltip with trend analysis
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-sm transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-gray-900/95 border-gray-700 text-white' 
            : 'bg-white/95 border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="h-4 w-4 text-blue-500" />
            <p className="font-semibold text-sm">{`${xAxis}: ${label}`}</p>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              const prevValue = index > 0 ? payload[index - 1].value : entry.value;
              const trend = entry.value > prevValue ? '↗' : entry.value < prevValue ? '↘' : '→';
              
              return (
                <div key={index} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="text-xs opacity-70">{trend}</span>
                  </div>
                  <span className="text-sm font-bold">
                    {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) : entry.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom dot with enhanced interactivity
  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    const isHovered = hoveredPoint?.dataKey === dataKey && hoveredPoint?.payload === payload;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 6 : 4}
        fill={props.fill}
        stroke="#ffffff"
        strokeWidth={2}
        style={{
          filter: isHovered ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' : 'none',
          transition: 'all 0.2s ease-out',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setHoveredPoint({ dataKey, payload })}
        onMouseLeave={() => setHoveredPoint(null)}
      />
    );
  };

  const isXAxisNumeric = typeof optimizedData[0]?.[xAxis] === 'number';

  return (
    <div className="relative group">
      {/* Enhanced Chart Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        <button
          onClick={() => setShowBrush(!showBrush)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            showBrush 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Toggle Navigation"
        >
          <Move className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowArea(!showArea)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            showArea 
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Toggle Area Fill"
        >
          <TrendingUp className="h-4 w-4" />
        </button>
        <button
          onClick={handleExport}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Export Chart"
        >
          <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <ResponsiveContainer width={width} height={height}>
        <ComposedChart 
          ref={chartRef}
          data={optimizedData} 
          margin={{ top: 20, right: 50, left: 20, bottom: showBrush ? 80 : 20 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
              strokeWidth={0.8}
              opacity={0.5}
            />
          )}
          
          <XAxis 
            dataKey={xAxis} 
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: theme === 'dark' ? '#4B5563' : '#D1D5DB', strokeWidth: 1 }}
            domain={isXAxisNumeric ? getXDomain() : undefined}
            type={isXAxisNumeric ? 'number' : 'category'}
            interval={optimizedData.length > 100 ? 'preserveStartEnd' : 0}
            tick={{ fontSize: 11, fontWeight: 500 }}
          />
          
          <YAxis 
            yAxisId="left"
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: theme === 'dark' ? '#4B5563' : '#D1D5DB', strokeWidth: 1 }}
            label={yKeys[0] ? { 
              value: yKeys[0], 
              angle: -90, 
              position: 'insideLeft', 
              style: { textAnchor: 'middle', fontSize: 12, fontWeight: 600 }
            } : undefined}
            domain={getYDomain()}
            tick={{ fontSize: 11, fontWeight: 500 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          
          {showRightAxis && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: theme === 'dark' ? '#4B5563' : '#D1D5DB', strokeWidth: 1 }}
              label={yKeys[1] ? { 
                value: yKeys[1], 
                angle: 90, 
                position: 'insideRight', 
                style: { textAnchor: 'middle', fontSize: 12, fontWeight: 600 }
              } : undefined}
              domain={getYDomain()}
              tick={{ fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value, entry) => (
              <span style={{ fontSize: 12, fontWeight: 500, color: entry.color }}>
                {value}
              </span>
            )}
          />
          
          {/* Reference line for mean */}
          <ReferenceLine 
            yAxisId="left"
            y={dataRanges.y.mean} 
            stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'} 
            strokeDasharray="5 5" 
            strokeWidth={1}
            opacity={0.6}
          />
          
          {/* Enhanced lines with areas */}
          {yKeys.map((key, index) => {
            const isVisible = visibleLines.has(key);
            const lineColor = currentColors.lines[index % currentColors.lines.length];
            const areaColor = currentColors.areas[index % currentColors.areas.length];
            
            return (
              <React.Fragment key={key}>
                {showArea && isVisible && (
                  <Area
                    type="monotone"
                    dataKey={normalized ? `${key}_normalized` : key}
                    fill={areaColor}
                    stroke="none"
                    yAxisId={index === 1 && showRightAxis ? "right" : "left"}
                    animationBegin={showAnimation ? index * 200 : 0}
                    animationDuration={showAnimation ? 1000 : 0}
                  />
                )}
                {isVisible && (
                  <Line 
                    type="monotone"
                    dataKey={normalized ? `${key}_normalized` : key}
                    stroke={lineColor}
                    strokeWidth={3}
                    dot={optimizedData.length > 200 ? false : <CustomDot />}
                    activeDot={{ 
                      r: 6, 
                      stroke: lineColor, 
                      strokeWidth: 3, 
                      fill: '#ffffff',
                      filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))'
                    }}
                    name={normalized ? `${key} (normalized)` : key}
                    yAxisId={index === 1 && showRightAxis ? "right" : "left"}
                    connectNulls={false}
                    animationBegin={showAnimation ? index * 200 : 0}
                    animationDuration={showAnimation ? 1200 : 0}
                    strokeDasharray={index === 2 ? "8 4" : undefined}
                  />
                )}
              </React.Fragment>
            );
          })}
          
          {/* Enhanced brush */}
          {showBrush && (
            <Brush
              dataKey={xAxis}
              height={40}
              stroke={currentColors.lines[0]}
              fill={theme === 'dark' ? '#374151' : '#F3F4F6'}
              onChange={handleBrushChange}
              startIndex={brushDomain.startIndex}
              endIndex={brushDomain.endIndex}
              tickFormatter={(value) => String(value).substring(0, 10)}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Enhanced legend with line visibility controls */}
      <div className="flex flex-wrap justify-center items-center space-x-4 mt-4">
        <div className="flex flex-wrap items-center space-x-4">
          {yKeys.map((y, idx) => {
            const isVisible = visibleLines.has(y);
            return (
              <button
                key={y}
                onClick={() => toggleLineVisibility(y)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isVisible 
                    ? 'bg-gray-100 dark:bg-gray-700' 
                    : 'bg-gray-50 dark:bg-gray-800 opacity-50'
                }`}
              >
                {isVisible ? (
                  <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                ) : (
                  <EyeOff className="h-3 w-3 text-gray-400" />
                )}
                <div 
                  className="w-4 h-0.5 rounded"
                  style={{ backgroundColor: currentColors.lines[idx % currentColors.lines.length] }}
                />
                <span className={`text-xs font-medium ${
                  isVisible ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}>
                  {normalized ? `${y} (normalized)` : y}
                </span>
              </button>
            );
          })}
        </div>
        
        {optimizedData.length < data.length && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
            Optimized: {optimizedData.length.toLocaleString()} of {data.length.toLocaleString()} points
          </div>
        )}
      </div>
    </div>
  );
};