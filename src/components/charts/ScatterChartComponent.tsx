import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Move, Download, Target, Filter, Layers, Zap, ZapOff } from 'lucide-react';
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
  data, xAxis, yAxis, normalized, width = '100%', height = 450, xMin, xMax, yMin, yMax 
}) => {
  const { theme } = useTheme();
  const [zoomDomain, setZoomDomain] = useState<{ x?: [number, number]; y?: [number, number] }>({});
  const [showGrid, setShowGrid] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set());
  const [brushSelection, setBrushSelection] = useState<any>(null);
  const [showDensity, setShowDensity] = useState(false);
  const [pointSize, setPointSize] = useState(4);
  const [enableOptimization, setEnableOptimization] = useState(data.length > 3000);
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const yKeys = Array.isArray(yAxis) ? yAxis.slice(0, 3) : [yAxis];
  
  // Enhanced color system with opacity variations
  const colorSystem = {
    light: {
      primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      secondary: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(139, 92, 246, 0.7)'],
      light: ['rgba(59, 130, 246, 0.3)', 'rgba(16, 185, 129, 0.3)', 'rgba(245, 158, 11, 0.3)', 'rgba(239, 68, 68, 0.3)', 'rgba(139, 92, 246, 0.3)']
    },
    dark: {
      primary: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
      secondary: ['rgba(96, 165, 250, 0.8)', 'rgba(52, 211, 153, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(248, 113, 113, 0.8)', 'rgba(167, 139, 250, 0.8)'],
      light: ['rgba(96, 165, 250, 0.4)', 'rgba(52, 211, 153, 0.4)', 'rgba(251, 191, 36, 0.4)', 'rgba(248, 113, 113, 0.4)', 'rgba(167, 139, 250, 0.4)']
    },
    accent: {
      primary: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
      secondary: ['rgba(139, 92, 246, 0.8)', 'rgba(6, 182, 212, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      light: ['rgba(139, 92, 246, 0.4)', 'rgba(6, 182, 212, 0.4)', 'rgba(16, 185, 129, 0.4)', 'rgba(245, 158, 11, 0.4)', 'rgba(239, 68, 68, 0.4)']
    }
  };
  
  const currentColors = colorSystem[theme];
  const showRightAxis = yKeys.length > 1;

  // Advanced data optimization with clustering for large datasets - now optional
  const optimizedData = useMemo(() => {
    if (!enableOptimization || data.length <= 3000) return data;
    
    // Implement k-means clustering for point reduction
    const clusterData = (points: DataPoint[], k: number = 3000): DataPoint[] => {
      if (points.length <= k) return points;
      
      // Simple grid-based clustering for performance
      const gridSize = Math.ceil(Math.sqrt(k));
      const clusters: { [key: string]: DataPoint[] } = {};
      
      // Find data bounds
      const xValues = points.map(p => Number(p[xAxis])).filter(v => !isNaN(v));
      const yValues = points.map(p => Number(p[yKeys[0]])).filter(v => !isNaN(v));
      
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      
      const xStep = (xMax - xMin) / gridSize;
      const yStep = (yMax - yMin) / gridSize;
      
      // Assign points to grid cells
      points.forEach(point => {
        const x = Number(point[xAxis]);
        const y = Number(point[yKeys[0]]);
        
        if (!isNaN(x) && !isNaN(y)) {
          const gridX = Math.floor((x - xMin) / xStep);
          const gridY = Math.floor((y - yMin) / yStep);
          const key = `${gridX}-${gridY}`;
          
          if (!clusters[key]) clusters[key] = [];
          clusters[key].push(point);
        }
      });
      
      // Return representative points from each cluster
      return Object.values(clusters).map(cluster => {
        if (cluster.length === 1) return cluster[0];
        
        // Return the point closest to cluster centroid
        const centroidX = cluster.reduce((sum, p) => sum + Number(p[xAxis]), 0) / cluster.length;
        const centroidY = cluster.reduce((sum, p) => sum + Number(p[yKeys[0]]), 0) / cluster.length;
        
        let closest = cluster[0];
        let minDist = Infinity;
        
        cluster.forEach(point => {
          const dist = Math.pow(Number(point[xAxis]) - centroidX, 2) + Math.pow(Number(point[yKeys[0]]) - centroidY, 2);
          if (dist < minDist) {
            minDist = dist;
            closest = point;
          }
        });
        
        return closest;
      });
    };
    
    return clusterData(data);
  }, [data, xAxis, yKeys, enableOptimization]);

  // For each yKey, create scatter data with enhanced properties
  const scatterDataArr = useMemo(() => {
    return yKeys.map((y, seriesIndex) =>
      optimizedData.map((item, index) => {
        const x = Number(item[xAxis]);
        const yVal = Number(normalized ? item[`${y}_normalized`] : item[y]);
        
        return {
          x,
          y: yVal,
          originalData: item,
          id: `${x}-${yVal}-${index}`,
          seriesIndex,
          size: pointSize + (Math.random() * 2), // Slight size variation
          opacity: selectedPoints.size === 0 ? 0.7 : selectedPoints.has(`${x}-${yVal}-${index}`) ? 1 : 0.3
        };
      }).filter(item => !isNaN(item.x) && !isNaN(item.y))
    );
  }, [optimizedData, xAxis, yKeys, normalized, selectedPoints, pointSize]);

  // Enhanced data ranges with statistical analysis and separate Y-axis ranges
  const dataRanges = useMemo(() => {
    const allXValues = scatterDataArr.flat().map(d => d.x);
    
    // Calculate separate ranges for each Y-axis
    const yRanges = yKeys.map((key, index) => {
      const yValues = scatterDataArr[index]?.map(d => d.y) || [];
      return yValues.length > 0 ? {
        min: Math.min(...yValues),
        max: Math.max(...yValues),
        mean: yValues.reduce((a, b) => a + b, 0) / yValues.length,
        std: 0
      } : { min: 0, max: 100, mean: 50, std: 0 };
    });

    const xStats = allXValues.length > 0 ? {
      min: Math.min(...allXValues),
      max: Math.max(...allXValues),
      mean: allXValues.reduce((a, b) => a + b, 0) / allXValues.length,
      std: 0
    } : { min: 0, max: 100, mean: 50, std: 0 };
    
    // Calculate standard deviation for each Y range
    yRanges.forEach((yRange, index) => {
      if (yRange.min !== 0 || yRange.max !== 100) {
        const yValues = scatterDataArr[index]?.map(d => d.y) || [];
        yRange.std = Math.sqrt(yValues.reduce((sum, y) => sum + Math.pow(y - yRange.mean, 2), 0) / yValues.length);
      }
    });
    
    // Calculate standard deviation for X
    xStats.std = Math.sqrt(allXValues.reduce((sum, x) => sum + Math.pow(x - xStats.mean, 2), 0) / allXValues.length);

    // Smart padding based on standard deviation
    const xPadding = xStats.std * 0.1;

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
        const yPadding = yRange.std * 0.1;
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
  }, [scatterDataArr, yKeys]);

  // Enhanced domain calculations with separate Y-axis domains
  const getXDomain = useCallback(() => {
    if (zoomDomain.x) {
      return zoomDomain.x;
    }
    if (xMin !== undefined || xMax !== undefined) {
      const min = xMin !== undefined ? xMin : dataRanges.x.min;
      const max = xMax !== undefined ? xMax : dataRanges.x.max;
      return [min, max];
    }
    return [dataRanges.x.min, dataRanges.x.max];
  }, [zoomDomain, xMin, xMax, dataRanges]);

  const getYDomain = useCallback((axisIndex: number = 0) => {
    if (zoomDomain.y) {
      return zoomDomain.y;
    }
    const yRange = dataRanges.y[axisIndex] || dataRanges.y[0];
    if (yMin !== undefined || yMax !== undefined) {
      const min = yMin !== undefined ? yMin : yRange.min;
      const max = yMax !== undefined ? yMax : yRange.max;
      return [min, max];
    }
    return [yRange.min, yRange.max];
  }, [zoomDomain, yMin, yMax, dataRanges]);

  // Enhanced zoom controls
  const handleZoomIn = useCallback(() => {
    const currentXDomain = zoomDomain.x || [dataRanges.x.min, dataRanges.x.max];
    const currentYDomain = zoomDomain.y || [dataRanges.y[0].min, dataRanges.y[0].max];
    
    const xCenter = (currentXDomain[0] + currentXDomain[1]) / 2;
    const yCenter = (currentYDomain[0] + currentYDomain[1]) / 2;
    const xRange = (currentXDomain[1] - currentXDomain[0]) * 0.6;
    const yRange = (currentYDomain[1] - currentYDomain[0]) * 0.6;
    
    setZoomDomain({
      x: [xCenter - xRange / 2, xCenter + xRange / 2],
      y: [yCenter - yRange / 2, yCenter + yRange / 2]
    });
  }, [zoomDomain, dataRanges]);

  const handleZoomOut = useCallback(() => {
    const currentXDomain = zoomDomain.x || [dataRanges.x.min, dataRanges.x.max];
    const currentYDomain = zoomDomain.y || [dataRanges.y[0].min, dataRanges.y[0].max];
    
    const xCenter = (currentXDomain[0] + currentXDomain[1]) / 2;
    const yCenter = (currentYDomain[0] + currentYDomain[1]) / 2;
    const xRange = Math.min((currentXDomain[1] - currentXDomain[0]) * 1.8, dataRanges.x.max - dataRanges.x.min);
    const yRange = Math.min((currentYDomain[1] - currentYDomain[0]) * 1.8, dataRanges.y[0].max - dataRanges.y[0].min);
    
    setZoomDomain({
      x: [
        Math.max(dataRanges.x.min, xCenter - xRange / 2), 
        Math.min(dataRanges.x.max, xCenter + xRange / 2)
      ],
      y: [
        Math.max(dataRanges.y[0].min, yCenter - yRange / 2), 
        Math.min(dataRanges.y[0].max, yCenter + yRange / 2)
      ]
    });
  }, [zoomDomain, dataRanges]);

  const handleResetZoom = useCallback(() => {
    setZoomDomain({});
    setSelectedPoints(new Set());
  }, []);

  // Point selection
  const handlePointClick = useCallback((data: any) => {
    const pointId = data.id;
    const newSelected = new Set(selectedPoints);
    
    if (newSelected.has(pointId)) {
      newSelected.delete(pointId);
    } else {
      newSelected.add(pointId);
    }
    
    setSelectedPoints(newSelected);
  }, [selectedPoints]);

  // Handle mouse events for data point info
  const handleMouseEnter = useCallback((data: any, event?: any) => {
    setHoveredData(data);
    
    // Track mouse position for floating card
    if (event && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredData(null);
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
        link.download = 'scatter-chart.png';
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }, []);

  // Custom shapes for different series
  const CustomShape = ({ cx, cy, fill, payload, seriesIndex }: any) => {
    const shapes = [
      // Circle
      <circle key="circle" cx={cx} cy={cy} r={payload.size} fill={fill} opacity={payload.opacity} />,
      // Square
      <rect key="square" x={cx - payload.size} y={cy - payload.size} width={payload.size * 2} height={payload.size * 2} fill={fill} opacity={payload.opacity} />,
      // Triangle
      <path key="triangle" d={`M${cx},${cy - payload.size} L${cx - payload.size},${cy + payload.size} L${cx + payload.size},${cy + payload.size} Z`} fill={fill} opacity={payload.opacity} />
    ];
    
    return (
      <g 
        style={{ cursor: 'pointer', transition: 'all 0.2s ease-out' }}
        onClick={() => handlePointClick(payload)}
        onMouseEnter={(e) => handleMouseEnter(payload, e)}
        onMouseLeave={handleMouseLeave}
      >
        {shapes[seriesIndex % shapes.length]}
        {selectedPoints.has(payload.id) && (
          <circle 
            cx={cx} 
            cy={cy} 
            r={payload.size + 2} 
            fill="none" 
            stroke="#3B82F6" 
            strokeWidth={2}
            opacity={0.8}
          />
        )}
      </g>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Chart Controls - Moved outside chart area */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showGrid 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Toggle Grid"
          >
            <Filter className="h-4 w-4 mr-2 inline" />
            Grid
          </button>
          
          <button
            onClick={() => setEnableOptimization(!enableOptimization)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              enableOptimization 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={enableOptimization ? "Disable Optimization" : "Enable Optimization"}
          >
            {enableOptimization ? <Zap className="h-4 w-4 mr-2 inline" /> : <ZapOff className="h-4 w-4 mr-2 inline" />}
            Optimize
          </button>
          
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <input
              type="range"
              min="2"
              max="8"
              value={pointSize}
              onChange={(e) => setPointSize(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">{pointSize}px</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            title="Export Chart"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart Area - Fixed size to prevent resizing */}
      <div className="w-full" style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart 
            ref={chartRef}
            margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
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
            type="number" 
            dataKey="x" 
            name={xAxis}
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: theme === 'dark' ? '#4B5563' : '#D1D5DB', strokeWidth: 1 }}
              domain={getXDomain()}
              tick={{ fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            
            <YAxis 
              yAxisId="left"
              type="number" 
              dataKey="y" 
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
              domain={getYDomain(0)}
              tick={{ fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            
            {showRightAxis && (
          <YAxis 
                yAxisId="right"
                orientation="right"
            type="number" 
            dataKey="y" 
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
                domain={getYDomain(1)}
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
            )}
            
            <Tooltip content={() => null} /> {/* Disable default tooltip */}
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value, entry) => (
                <span style={{ fontSize: 12, fontWeight: 500, color: entry.color }}>
                  {value}
                </span>
              )}
            />
            
            {/* Reference lines for means - separate for each axis */}
            <ReferenceLine 
              x={dataRanges.x.mean} 
              yAxisId="left"
              stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'} 
              strokeDasharray="5 5" 
              strokeWidth={1}
              opacity={0.6}
            />
            {dataRanges.y.map((yRange, index) => (
              <ReferenceLine 
                key={`y-mean-${index}`}
                yAxisId={index === 1 && showRightAxis ? "right" : "left"}
                y={yRange.mean} 
                stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'} 
                strokeDasharray="5 5" 
                strokeWidth={1}
                opacity={0.6}
              />
            ))}
            
            {/* Enhanced scatter plots */}
            {yKeys.map((key, index) => (
          <Scatter 
                key={key}
                data={scatterDataArr[index]} 
                fill={currentColors.primary[index % currentColors.primary.length]}
                name={normalized ? `${key} (normalized)` : key}
                yAxisId={index === 1 && showRightAxis ? "right" : "left"}
                shape={<CustomShape seriesIndex={index} />}
                animationBegin={showAnimation ? index * 300 : 0}
                animationDuration={showAnimation ? 1000 : 0}
              />
            ))}
        </ScatterChart>
      </ResponsiveContainer>
      </div>

      {/* Minimalist Floating Data Point Card */}
      {hoveredData && (
        <div 
          className={`absolute z-50 pointer-events-none transition-all duration-200 ${
            theme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700 text-white' 
              : 'bg-white/95 border-gray-200 text-gray-900'
          } backdrop-blur-md rounded-lg border shadow-xl px-3 py-2 min-w-40`}
          style={{
            left: Math.min(mousePosition.x + 15, (containerRef.current?.offsetWidth || 0) - 180),
            top: Math.max(mousePosition.y - 60, 10),
            transform: 'translateZ(0)' // Force hardware acceleration
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{xAxis}</span>
              <span className="text-sm font-bold">{hoveredData.x?.toFixed(3)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {normalized ? `${yKeys[hoveredData.seriesIndex]} (norm)` : yKeys[hoveredData.seriesIndex]}
              </span>
              <span 
                className="text-sm font-bold"
                style={{ color: currentColors.primary[hoveredData.seriesIndex % currentColors.primary.length] }}
              >
                {hoveredData.y?.toFixed(3)}
              </span>
            </div>
          </div>
          
          {/* Small arrow pointing to data point */}
          <div 
            className={`absolute w-2 h-2 transform rotate-45 ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-white'
            } border-l border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
            style={{
              left: -4,
              top: '50%',
              marginTop: -4
            }}
          />
        </div>
      )}
      
      {/* Enhanced legend with statistics */}
      <div className="flex flex-wrap justify-center items-center space-x-4 mt-6">
        <div className="flex flex-wrap items-center space-x-4">
          {yKeys.map((y, idx) => (
            <div key={y} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: currentColors.primary[idx % currentColors.primary.length] }}
              />
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {normalized ? `${y} (normalized)` : y}
              </span>
            </div>
          ))}
        </div>
        
        {enableOptimization && optimizedData.length < data.length && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
            Clustered: {optimizedData.length.toLocaleString()} of {data.length.toLocaleString()} points
          </div>
        )}
        
        {selectedPoints.size > 0 && (
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
            {selectedPoints.size} points selected
          </div>
        )}
      </div>
    </div>
  );
};