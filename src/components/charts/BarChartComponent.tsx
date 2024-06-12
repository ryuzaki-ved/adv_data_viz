import React, { useState, useRef, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine, Legend, Cell } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Move, Download, Maximize2, Settings, TrendingUp } from 'lucide-react';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface BarChartComponentProps {
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

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  data, xAxis, yAxis, normalized, width = '100%', height = 350, xMin, xMax, yMin, yMax 
}) => {
  const { theme } = useTheme();
  const [zoomDomain, setZoomDomain] = useState<{ left?: number; right?: number }>({});
  const [brushDomain, setBrushDomain] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [showBrush, setShowBrush] = useState(data.length > 50);
  const [showGrid, setShowGrid] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedBars, setSelectedBars] = useState<Set<string>>(new Set());
  const chartRef = useRef<any>(null);
  
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  
  // Enhanced color palettes with gradients
  const colorPalettes = {
    light: {
      primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      gradients: [
        'url(#blueGradient)',
        'url(#greenGradient)', 
        'url(#orangeGradient)',
        'url(#redGradient)',
        'url(#purpleGradient)'
      ]
    },
    dark: {
      primary: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
      gradients: [
        'url(#blueDarkGradient)',
        'url(#greenDarkGradient)',
        'url(#orangeDarkGradient)', 
        'url(#redDarkGradient)',
        'url(#purpleDarkGradient)'
      ]
    },
    accent: {
      primary: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      gradients: [
        'url(#purpleAccentGradient)',
        'url(#blueAccentGradient)',
        'url(#greenAccentGradient)',
        'url(#orangeAccentGradient)',
        'url(#redAccentGradient)'
      ]
    }
  };
  
  const currentPalette = colorPalettes[theme];
  const showRightAxis = yKeys.length > 1;

  // Intelligent data optimization with trend preservation
  const optimizedData = useMemo(() => {
    if (data.length <= 1000) return data;
    
    // Advanced sampling that preserves peaks and trends
    const sampleSize = 1000;
    const step = data.length / sampleSize;
    const sampled = [];
    
    // Always include first and last points
    sampled.push(data[0]);
    
    // Use adaptive sampling based on data variance
    for (let i = 1; i < data.length - 1; i += step) {
      const index = Math.floor(i);
      const point = data[index];
      
      // Include points with significant changes
      const prevPoint = data[Math.max(0, index - 1)];
      const nextPoint = data[Math.min(data.length - 1, index + 1)];
      
      let shouldInclude = false;
      yKeys.forEach(key => {
        const current = Number(point[key]);
        const prev = Number(prevPoint[key]);
        const next = Number(nextPoint[key]);
        
        // Include if it's a local extremum or significant change
        if ((current > prev && current > next) || 
            (current < prev && current < next) ||
            Math.abs(current - prev) > Math.abs(next - prev) * 0.5) {
          shouldInclude = true;
        }
      });
      
      if (shouldInclude || sampled.length < sampleSize) {
        sampled.push(point);
      }
    }
    
    sampled.push(data[data.length - 1]);
    return sampled.slice(0, sampleSize);
  }, [data, yKeys]);

  // Enhanced data ranges calculation
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
      max: Math.max(...xValues)
    } : { min: 0, max: 100 };

    const yRange = yValues.length > 0 ? {
      min: Math.min(...yValues),
      max: Math.max(...yValues)
    } : { min: 0, max: 100 };

    // Smart padding based on data distribution
    const xPadding = (xRange.max - xRange.min) * 0.05;
    const yPadding = (yRange.max - yRange.min) * 0.1;

    return {
      x: {
        min: xRange.min - xPadding,
        max: xRange.max + xPadding,
        dataMin: xRange.min,
        dataMax: xRange.max
      },
      y: {
        min: Math.max(0, yRange.min - yPadding), // Don't go below 0 for bars
        max: yRange.max + yPadding,
        dataMin: yRange.min,
        dataMax: yRange.max
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

  // Enhanced zoom controls with smooth animations
  const handleZoomIn = useCallback(() => {
    const currentDomain = zoomDomain;
    const dataLength = optimizedData.length;
    const left = currentDomain.left || 0;
    const right = currentDomain.right || dataLength - 1;
    const center = (left + right) / 2;
    const newRange = (right - left) * 0.6; // Smoother zoom factor
    
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
    const newRange = Math.min((right - left) * 1.8, dataLength); // Smoother zoom factor
    
    setZoomDomain({
      left: Math.max(0, center - newRange / 2),
      right: Math.min(dataLength - 1, center + newRange / 2)
    });
  }, [zoomDomain, optimizedData.length]);

  const handleResetZoom = useCallback(() => {
    setZoomDomain({});
    setBrushDomain({});
    setSelectedBars(new Set());
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

  // Enhanced bar interactions
  const handleBarClick = useCallback((data: any, index: number) => {
    const barId = `${data[xAxis]}-${index}`;
    const newSelected = new Set(selectedBars);
    
    if (newSelected.has(barId)) {
      newSelected.delete(barId);
    } else {
      newSelected.add(barId);
    }
    
    setSelectedBars(newSelected);
  }, [selectedBars, xAxis]);

  const handleBarHover = useCallback((data: any, index: number) => {
    setHoveredBar(`${data[xAxis]}-${index}`);
  }, [xAxis]);

  const handleBarLeave = useCallback(() => {
    setHoveredBar(null);
  }, []);

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
        link.download = 'chart.png';
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }, []);

  // Professional tooltip with enhanced styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-sm transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-gray-900/95 border-gray-700 text-white' 
            : 'bg-white/95 border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <p className="font-semibold text-sm">{`${xAxis}: ${label}`}</p>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium">{entry.name}</span>
                </div>
                <span className="text-sm font-bold">
                  {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom bar shape with enhanced styling
  const CustomBar = (props: any) => {
    const { payload, x, y, width, height, fill } = props;
    const barId = `${payload[xAxis]}-${props.index}`;
    const isHovered = hoveredBar === barId;
    const isSelected = selectedBars.has(barId);
    
    return (
      <g>
        <defs>
          <linearGradient id={`barGradient-${props.index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.6" />
          </linearGradient>
          <filter id={`shadow-${props.index}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#barGradient-${props.index})`}
          stroke={isSelected ? '#3B82F6' : 'transparent'}
          strokeWidth={isSelected ? 2 : 0}
          rx={3}
          ry={3}
          filter={isHovered ? `url(#shadow-${props.index})` : undefined}
          style={{
            transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
            transformOrigin: 'bottom',
            transition: 'all 0.2s ease-out',
            cursor: 'pointer'
          }}
          onClick={() => handleBarClick(payload, props.index)}
          onMouseEnter={() => handleBarHover(payload, props.index)}
          onMouseLeave={handleBarLeave}
        />
      </g>
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
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            showGrid 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Toggle Grid"
        >
          <Settings className="h-4 w-4" />
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
        <BarChart 
          ref={chartRef}
          data={optimizedData} 
          margin={{ top: 20, right: 50, left: 20, bottom: showBrush ? 80 : 20 }}
        >
          <defs>
            {/* Enhanced gradients */}
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
              strokeWidth={0.8}
              opacity={0.6}
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
            iconType="rect"
            formatter={(value) => <span style={{ fontSize: 12, fontWeight: 500 }}>{value}</span>}
          />
          
          {/* Enhanced bars with animations */}
          {yKeys.map((key, index) => (
            <Bar 
              key={key}
              dataKey={normalized ? `${key}_normalized` : key} 
              fill={currentPalette.primary[index % currentPalette.primary.length]}
              radius={[4, 4, 0, 0]}
              name={normalized ? `${key} (normalized)` : key}
              yAxisId={index === 1 && showRightAxis ? "right" : "left"}
              animationBegin={showAnimation ? index * 100 : 0}
              animationDuration={showAnimation ? 800 : 0}
              shape={<CustomBar />}
            />
          ))}
          
          {/* Enhanced brush */}
          {showBrush && (
            <Brush
              dataKey={xAxis}
              height={40}
              stroke={currentPalette.primary[0]}
              fill={theme === 'dark' ? '#374151' : '#F3F4F6'}
              onChange={handleBrushChange}
              startIndex={brushDomain.startIndex}
              endIndex={brushDomain.endIndex}
              tickFormatter={(value) => String(value).substring(0, 10)}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      
      {/* Enhanced legend with statistics */}
      <div className="flex flex-wrap justify-center items-center space-x-6 mt-4 text-xs">
        {yKeys.map((y, idx) => (
          <div key={y} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: currentPalette.primary[idx % currentPalette.primary.length] }}
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {normalized ? `${y} (normalized)` : y}
            </span>
          </div>
        ))}
        {optimizedData.length < data.length && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
            Showing {optimizedData.length.toLocaleString()} of {data.length.toLocaleString()} points
          </div>
        )}
        {selectedBars.size > 0 && (
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
            {selectedBars.size} bars selected
          </div>
        )}
      </div>
    </div>
  );
};