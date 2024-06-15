import React, { useState, useRef, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine, Legend, Area, ComposedChart } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Move, Download, TrendingUp, Activity, Eye, EyeOff, Zap, ZapOff, Settings, Grid3x3, Layers } from 'lucide-react';
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
  const [enableOptimization, setEnableOptimization] = useState(data.length > 2000);
  const [lineStyle, setLineStyle] = useState<'smooth' | 'linear' | 'step'>('smooth');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showDataPoints, setShowDataPoints] = useState(data.length <= 200);
  const [controlsVisible, setControlsVisible] = useState(false);
  const chartRef = useRef<any>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  
  // Initialize visible lines
  React.useEffect(() => {
    setVisibleLines(new Set(yKeys));
  }, [yKeys]);

  // Enhanced hover detection for controls
  const handleMouseEnter = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    // Check if mouse is leaving to go to controls or completely outside
    const containerRect = containerRef.current?.getBoundingClientRect();
    const controlsRect = controlsRef.current?.getBoundingClientRect();
    
    if (containerRect && controlsRect) {
      const { clientX, clientY } = e;
      
      // Create a combined bounding box that includes both chart and controls
      const combinedRect = {
        left: Math.min(containerRect.left, controlsRect.left) - 10,
        right: Math.max(containerRect.right, controlsRect.right) + 10,
        top: Math.min(containerRect.top, controlsRect.top) - 10,
        bottom: Math.max(containerRect.bottom, controlsRect.bottom) + 10
      };
      
      // Only hide if mouse is completely outside the combined area
      if (clientX < combinedRect.left || clientX > combinedRect.right ||
          clientY < combinedRect.top || clientY > combinedRect.bottom) {
        setControlsVisible(false);
      }
    }
  }, []);

  // Professional color system with enhanced gradients and accessibility
  const colorSystem = {
    light: {
      lines: [
        '#2563EB', // Blue 600
        '#059669', // Emerald 600  
        '#DC2626', // Red 600
        '#7C3AED', // Violet 600
        '#EA580C', // Orange 600
        '#0891B2', // Cyan 600
        '#65A30D', // Lime 600
        '#C2410C'  // Orange 700
      ],
      areas: [
        'rgba(37, 99, 235, 0.08)',
        'rgba(5, 150, 105, 0.08)', 
        'rgba(220, 38, 38, 0.08)',
        'rgba(124, 58, 237, 0.08)',
        'rgba(234, 88, 12, 0.08)',
        'rgba(8, 145, 178, 0.08)',
        'rgba(101, 163, 13, 0.08)',
        'rgba(194, 65, 12, 0.08)'
      ],
      dots: [
        '#1D4ED8', // Blue 700
        '#047857', // Emerald 700
        '#B91C1C', // Red 700
        '#6D28D9', // Violet 700
        '#C2410C', // Orange 700
        '#0E7490', // Cyan 700
        '#4D7C0F', // Lime 700
        '#9A3412'  // Orange 800
      ],
      grid: '#F1F5F9',
      axis: '#64748B',
      background: '#FFFFFF'
    },
    dark: {
      lines: [
        '#60A5FA', // Blue 400
        '#34D399', // Emerald 400
        '#F87171', // Red 400
        '#A78BFA', // Violet 400
        '#FB923C', // Orange 400
        '#22D3EE', // Cyan 400
        '#A3E635', // Lime 400
        '#FDBA74'  // Orange 300
      ],
      areas: [
        'rgba(96, 165, 250, 0.12)',
        'rgba(52, 211, 153, 0.12)',
        'rgba(248, 113, 113, 0.12)',
        'rgba(167, 139, 250, 0.12)',
        'rgba(251, 146, 60, 0.12)',
        'rgba(34, 211, 238, 0.12)',
        'rgba(163, 230, 53, 0.12)',
        'rgba(253, 186, 116, 0.12)'
      ],
      dots: [
        '#3B82F6', // Blue 500
        '#10B981', // Emerald 500
        '#EF4444', // Red 500
        '#8B5CF6', // Violet 500
        '#F97316', // Orange 500
        '#06B6D4', // Cyan 500
        '#84CC16', // Lime 500
        '#FB923C'  // Orange 400
      ],
      grid: '#334155',
      axis: '#94A3B8',
      background: '#1E293B'
    },
    accent: {
      lines: [
        '#8B5CF6', // Violet 500
        '#06B6D4', // Cyan 500
        '#10B981', // Emerald 500
        '#F59E0B', // Amber 500
        '#EF4444', // Red 500
        '#3B82F6', // Blue 500
        '#84CC16', // Lime 500
        '#F97316'  // Orange 500
      ],
      areas: [
        'rgba(139, 92, 246, 0.1)',
        'rgba(6, 182, 212, 0.1)',
        'rgba(16, 185, 129, 0.1)',
        'rgba(245, 158, 11, 0.1)',
        'rgba(239, 68, 68, 0.1)',
        'rgba(59, 130, 246, 0.1)',
        'rgba(132, 204, 22, 0.1)',
        'rgba(249, 115, 22, 0.1)'
      ],
      dots: [
        '#7C3AED', // Violet 600
        '#0891B2', // Cyan 600
        '#059669', // Emerald 600
        '#D97706', // Amber 600
        '#DC2626', // Red 600
        '#2563EB', // Blue 600
        '#65A30D', // Lime 600
        '#EA580C'  // Orange 600
      ],
      grid: '#E0E7FF',
      axis: '#6366F1',
      background: '#FAFBFF'
    }
  };
  
  const currentColors = colorSystem[theme];
  const showRightAxis = yKeys.length > 1;

  // Advanced data optimization with trend analysis - now optional
  const optimizedData = useMemo(() => {
    if (!enableOptimization || data.length <= 2000) return data;
    
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
  }, [data, xAxis, yKeys, enableOptimization]);

  // Enhanced data ranges with statistical analysis and separate Y-axis ranges
  const dataRanges = useMemo(() => {
    const xValues = optimizedData.map(d => {
      const val = d[xAxis];
      return typeof val === 'number' ? val : parseFloat(String(val));
    }).filter(v => !isNaN(v));

    // Calculate separate ranges for each Y-axis
    const yRanges = yKeys.map(key => {
      const yValues = optimizedData.map(d => {
        const val = normalized ? d[`${key}_normalized`] : d[key];
        return typeof val === 'number' ? val : parseFloat(String(val));
      }).filter(v => !isNaN(v));

      return yValues.length > 0 ? {
        min: Math.min(...yValues),
        max: Math.max(...yValues),
        mean: yValues.reduce((a, b) => a + b, 0) / yValues.length,
        std: 0
      } : { min: 0, max: 100, mean: 50, std: 0 };
    });

    const xStats = xValues.length > 0 ? {
      min: Math.min(...xValues),
      max: Math.max(...xValues),
      mean: xValues.reduce((a, b) => a + b, 0) / xValues.length,
      std: 0
    } : { min: 0, max: 100, mean: 50, std: 0 };
    
    // Calculate standard deviation for each Y range
    yRanges.forEach((yRange, index) => {
      if (yRange.min !== 0 || yRange.max !== 100) {
        const yValues = optimizedData.map(d => {
          const val = normalized ? d[`${yKeys[index]}_normalized`] : d[yKeys[index]];
          return typeof val === 'number' ? val : parseFloat(String(val));
        }).filter(v => !isNaN(v));
        
        yRange.std = Math.sqrt(yValues.reduce((sum, y) => sum + Math.pow(y - yRange.mean, 2), 0) / yValues.length);
      }
    });
    
    // Calculate standard deviation for X
    xStats.std = Math.sqrt(xValues.reduce((sum, x) => sum + Math.pow(x - xStats.mean, 2), 0) / xValues.length);

    // Adaptive padding based on standard deviation
    const xPadding = xStats.std * 0.05;

    return {
      x: {
        min: xStats.min - xPadding,
        max: xStats.max + xPadding,
        dataMin: xStats.min,
        dataMax: xStats.max,
        mean: xStats.mean,
        std: xStats.std
      },
      y: yRanges.map(yRange => {
        const yPadding = yRange.std * 0.05;
        return {
          min: yRange.min - yPadding,
          max: yRange.max + yPadding,
          dataMin: yRange.min,
          dataMax: yRange.max,
          mean: yRange.mean,
          std: yRange.std
        };
      })
    };
  }, [optimizedData, xAxis, yKeys, normalized]);

  // Enhanced domain calculations with separate Y-axis domains
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

  const getYDomain = useCallback((axisIndex: number = 0) => {
    const yRange = dataRanges.y[axisIndex] || dataRanges.y[0];
    if (yMin !== undefined || yMax !== undefined) {
      const min = yMin !== undefined ? yMin : yRange.min;
      const max = yMax !== undefined ? yMax : yRange.max;
      return [min, max];
    }
    return [yRange.min, yRange.max];
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

  // Compact tooltip that follows cursor
  const CustomTooltip = ({ active, payload, label, coordinate }: any) => {
    if (active && payload && payload.length && coordinate) {
      return (
        <div 
          className={`fixed z-50 px-3 py-2 rounded-lg shadow-xl border text-xs font-medium pointer-events-none transition-all duration-200 ${
            theme === 'dark' 
              ? 'bg-gray-900/95 border-gray-600 text-white' 
              : theme === 'accent'
              ? 'bg-white/95 border-violet-200 text-gray-900'
              : 'bg-white/95 border-gray-200 text-gray-900'
          }`}
          style={{
            left: coordinate.x + 10,
            top: coordinate.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="h-3 w-3 text-blue-500" />
            <span className="font-semibold">{`${xAxis}: ${typeof label === 'number' ? label.toFixed(2) : label}`}</span>
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs">{entry.name}</span>
                </div>
                <span className="text-xs font-bold">
                  {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced custom dot with professional styling
  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey, fill } = props;
    const isHovered = hoveredPoint?.dataKey === dataKey && hoveredPoint?.payload === payload;
    
    return (
      <g>
        <defs>
          <filter id={`glow-${dataKey}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id={`dotGradient-${dataKey}`} cx="0.3" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor={fill} stopOpacity="1" />
          </radialGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 8 : 5}
          fill={`url(#dotGradient-${dataKey})`}
          stroke={fill}
          strokeWidth={isHovered ? 3 : 2}
          filter={isHovered ? `url(#glow-${dataKey})` : undefined}
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            transformOrigin: `${cx}px ${cy}px`
          }}
          onMouseEnter={() => setHoveredPoint({ dataKey, payload })}
          onMouseLeave={() => setHoveredPoint(null)}
        />
        {isHovered && (
          <circle
            cx={cx}
            cy={cy}
            r={12}
            fill="none"
            stroke={fill}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.6}
            style={{
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </g>
    );
  };

  const isXAxisNumeric = typeof optimizedData[0]?.[xAxis] === 'number';

  return (
    <div className="relative w-full">
      {/* Professional Chart Container with Enhanced Styling */}
      <div 
        ref={containerRef}
        className={`relative rounded-2xl border-2 shadow-xl transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-gray-900/50' 
            : theme === 'accent'
            ? 'bg-gradient-to-br from-white via-violet-50/30 to-white border-violet-200 shadow-violet-500/20'
            : 'bg-gradient-to-br from-white via-blue-50/30 to-white border-gray-200 shadow-gray-500/20'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Chart Area */}
        <div className="relative p-6">
          <ResponsiveContainer width={width} height={height}>
            <ComposedChart 
              ref={chartRef}
              data={optimizedData} 
              margin={{ top: 30, right: 60, left: 30, bottom: showBrush ? 100 : 30 }}
            >
              <defs>
                {/* Enhanced gradients for areas */}
                {yKeys.map((key, index) => (
                  <linearGradient key={`areaGradient-${key}`} id={`areaGradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={currentColors.lines[index % currentColors.lines.length]} stopOpacity="0.3" />
                    <stop offset="50%" stopColor={currentColors.lines[index % currentColors.lines.length]} stopOpacity="0.1" />
                    <stop offset="100%" stopColor={currentColors.lines[index % currentColors.lines.length]} stopOpacity="0.05" />
                  </linearGradient>
                ))}
                
                {/* Professional grid pattern */}
                <pattern id="gridPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke={currentColors.grid} strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="1 3" 
                  stroke={currentColors.grid} 
                  strokeWidth={0.8}
                  opacity={0.4}
                  horizontal={true}
                  vertical={true}
                />
              )}
              
        <XAxis 
          dataKey={xAxis} 
                stroke={currentColors.axis}
                fontSize={13}
                fontWeight={500}
                tickLine={{ stroke: currentColors.axis, strokeWidth: 1 }}
                axisLine={{ stroke: currentColors.axis, strokeWidth: 2 }}
                domain={isXAxisNumeric ? getXDomain() : undefined}
                type={isXAxisNumeric ? 'number' : 'category'}
                interval={optimizedData.length > 100 ? 'preserveStartEnd' : 0}
                tick={{ 
                  fontSize: 12, 
                  fontWeight: 500,
                  fill: currentColors.axis
                }}
                tickFormatter={(value) => {
                  if (typeof value === 'number') {
                    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
                  }
                  return String(value).length > 10 ? String(value).substring(0, 10) + '...' : String(value);
                }}
              />
              
              <YAxis 
                yAxisId="left"
                stroke={currentColors.axis}
                fontSize={13}
                fontWeight={500}
                tickLine={{ stroke: currentColors.axis, strokeWidth: 1 }}
                axisLine={{ stroke: currentColors.axis, strokeWidth: 2 }}
                label={yKeys[0] ? { 
                  value: yKeys[0], 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { 
                    textAnchor: 'middle', 
                    fontSize: 14, 
                    fontWeight: 600,
                    fill: currentColors.axis
                  }
                } : undefined}
                domain={getYDomain(0)}
                tick={{ 
                  fontSize: 12, 
                  fontWeight: 500,
                  fill: currentColors.axis
                }}
                tickFormatter={(value) => value.toLocaleString(undefined, { 
                  notation: 'compact',
                  maximumFractionDigits: 2
                })}
              />
              
              {showRightAxis && (
        <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={currentColors.axis}
                  fontSize={13}
                  fontWeight={500}
                  tickLine={{ stroke: currentColors.axis, strokeWidth: 1 }}
                  axisLine={{ stroke: currentColors.axis, strokeWidth: 2 }}
                  label={yKeys[1] ? { 
                    value: yKeys[1], 
                    angle: 90, 
                    position: 'insideRight', 
                    style: { 
                      textAnchor: 'middle', 
                      fontSize: 14, 
                      fontWeight: 600,
                      fill: currentColors.axis
                    }
                  } : undefined}
                  domain={getYDomain(1)}
                  tick={{ 
                    fontSize: 12, 
                    fontWeight: 500,
                    fill: currentColors.axis
                  }}
                  tickFormatter={(value) => value.toLocaleString(undefined, { 
                    notation: 'compact',
                    maximumFractionDigits: 2
                  })}
                />
              )}
              
              <Tooltip content={<CustomTooltip />} cursor={{ 
                stroke: currentColors.lines[0], 
                strokeWidth: 2, 
                strokeDasharray: '5 5',
                opacity: 0.7
              }} />
              
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '25px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
                iconType="line"
                formatter={(value, entry) => (
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: entry.color,
                    textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(255,255,255,0.8)'
                  }}>
                    {value}
                  </span>
                )}
              />
              
              {/* Professional reference lines for statistical insights */}
              <ReferenceLine 
                x={dataRanges.x.mean}
                yAxisId="left"
                stroke={currentColors.axis} 
                strokeDasharray="8 4" 
                strokeWidth={1.5}
                opacity={0.5}
                label={{ 
                  value: "X Mean", 
                  position: "topRight",
                  style: { fontSize: 11, fontWeight: 500, fill: currentColors.axis }
                }}
              />
              {dataRanges.y.map((yRange, index) => (
                <ReferenceLine 
                  key={`y-mean-${index}`}
                  yAxisId={index === 1 && showRightAxis ? "right" : "left"}
                  y={yRange.mean} 
                  stroke={currentColors.lines[index % currentColors.lines.length]} 
                  strokeDasharray="8 4" 
                  strokeWidth={1.5}
                  opacity={0.4}
                  label={{ 
                    value: `${yKeys[index]} Mean`, 
                    position: "topLeft",
                    style: { fontSize: 11, fontWeight: 500, fill: currentColors.lines[index % currentColors.lines.length] }
                  }}
                />
              ))}
              
              {/* Enhanced lines with professional styling */}
              {yKeys.map((key, index) => {
                const isVisible = visibleLines.has(key);
                const lineColor = currentColors.lines[index % currentColors.lines.length];
                const areaColor = `url(#areaGradient-${key})`;
                
                return (
                  <React.Fragment key={key}>
                    {showArea && isVisible && (
                      <Area
                        type={lineStyle === 'step' ? 'stepAfter' : lineStyle === 'linear' ? 'linear' : 'monotone'}
                        dataKey={normalized ? `${key}_normalized` : key}
                        fill={areaColor}
                        stroke="none"
                        yAxisId={index === 1 && showRightAxis ? "right" : "left"}
                        animationBegin={showAnimation ? index * 300 : 0}
                        animationDuration={showAnimation ? 1500 : 0}
                        animationEasing="ease-out"
                      />
                    )}
                    {isVisible && (
        <Line 
                        type={lineStyle === 'step' ? 'stepAfter' : lineStyle === 'linear' ? 'linear' : 'monotone'}
                        dataKey={normalized ? `${key}_normalized` : key}
                        stroke={lineColor}
                        strokeWidth={strokeWidth}
                        dot={showDataPoints ? <CustomDot /> : false}
                        activeDot={{ 
                          r: 8, 
                          stroke: lineColor, 
                          strokeWidth: 3, 
                          fill: '#ffffff',
                          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                          style: {
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }
                        }}
                        name={normalized ? `${key} (normalized)` : key}
                        yAxisId={index === 1 && showRightAxis ? "right" : "left"}
                        connectNulls={false}
                        animationBegin={showAnimation ? index * 300 : 0}
                        animationDuration={showAnimation ? 1800 : 0}
                        animationEasing="ease-out"
                        strokeDasharray={index === 2 ? "12 6" : index === 3 ? "6 3" : undefined}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </React.Fragment>
                );
              })}
              
              {/* Enhanced brush with professional styling */}
              {showBrush && (
                <Brush
                  dataKey={xAxis}
                  height={50}
                  stroke={currentColors.lines[0]}
                  fill={theme === 'dark' ? '#374151' : theme === 'accent' ? '#F3F4F6' : '#F9FAFB'}
                  onChange={handleBrushChange}
                  startIndex={brushDomain.startIndex}
                  endIndex={brushDomain.endIndex}
                  tickFormatter={(value) => String(value).substring(0, 12)}
                  travellerWidth={12}
                />
              )}
            </ComposedChart>
    </ResponsiveContainer>
        </div>
      </div>

      {/* Enhanced Chart Controls - Fixed Positioning Outside Chart Area */}
      <div 
        ref={controlsRef}
        className={`absolute -top-6 -right-6 transition-all duration-500 transform z-50 ${
          controlsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
        onMouseEnter={() => setControlsVisible(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`flex flex-wrap items-center gap-2 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
          theme === 'dark' 
            ? 'bg-gray-900/95 border-gray-700 shadow-gray-900/50' 
            : theme === 'accent'
            ? 'bg-white/95 border-violet-200 shadow-violet-500/20'
            : 'bg-white/95 border-gray-200 shadow-gray-500/20'
        }`}>
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Display Controls */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setShowBrush(!showBrush)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                showBrush 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle Navigation"
            >
              <Move className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                showGrid 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle Grid"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowArea(!showArea)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                showArea 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle Area Fill"
            >
              <TrendingUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDataPoints(!showDataPoints)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                showDataPoints 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle Data Points"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          {/* Style Controls */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <select
              value={lineStyle}
              onChange={(e) => setLineStyle(e.target.value as 'smooth' | 'linear' | 'step')}
              className="text-xs px-2 py-1 rounded bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
              title="Line Style"
            >
              <option value="smooth">Smooth</option>
              <option value="linear">Linear</option>
              <option value="step">Step</option>
            </select>
            <input
              type="range"
              min="1"
              max="6"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-12"
              title="Line Width"
            />
          </div>

          {/* Utility Controls */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setEnableOptimization(!enableOptimization)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                enableOptimization 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title={enableOptimization ? "Disable Optimization" : "Enable Optimization"}
            >
              {enableOptimization ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              title="Export Chart"
            >
              <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Enhanced legend with professional line visibility controls */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap justify-center items-center gap-3">
          {yKeys.map((y, idx) => {
            const isVisible = visibleLines.has(y);
            return (
              <button
                key={y}
                onClick={() => toggleLineVisibility(y)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  isVisible 
                    ? theme === 'dark'
                      ? 'bg-gray-800 border-2 border-gray-600 shadow-lg' 
                      : theme === 'accent'
                      ? 'bg-violet-50 border-2 border-violet-200 shadow-lg shadow-violet-500/20'
                      : 'bg-gray-50 border-2 border-gray-200 shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent opacity-50 hover:opacity-75'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isVisible ? (
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <div 
                    className="w-6 h-1 rounded-full shadow-sm"
                    style={{ backgroundColor: currentColors.lines[idx % currentColors.lines.length] }}
                  />
                </div>
                <span className={`text-sm font-semibold ${
                  isVisible ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}>
                  {normalized ? `${y} (normalized)` : y}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Status indicators */}
        <div className="flex flex-wrap justify-center items-center gap-3 text-xs">
          {enableOptimization && optimizedData.length < data.length && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Zap className="h-3 w-3" />
              <span>Optimized: {optimizedData.length.toLocaleString()} of {data.length.toLocaleString()} points</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800">
            <Activity className="h-3 w-3" />
            <span>{visibleLines.size} of {yKeys.length} series visible</span>
          </div>
          
          {showArea && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800">
              <TrendingUp className="h-3 w-3" />
              <span>Area fill enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Professional CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};