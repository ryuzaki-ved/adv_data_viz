import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Move, Download, Target, Filter, Layers } from 'lucide-react';
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
  const [showGrid, setShowGrid] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set());
  const [brushSelection, setBrushSelection] = useState<any>(null);
  const [showDensity, setShowDensity] = useState(false);
  const [pointSize, setPointSize] = useState(4);
  const chartRef = useRef<any>(null);
  
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

  // Advanced data optimization with clustering for large datasets
  const optimizedData = useMemo(() => {
    if (data.length <= 3000) return data;
    
    // Implement k-means clustering for point reduction
    const clusterData = (points: DataPoint[], k: number = 2000): DataPoint[] => {
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
  }, [data, xAxis, yKeys]);

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

  // Enhanced data ranges with statistical analysis
  const dataRanges = useMemo(() => {
    const allXValues = scatterDataArr.flat().map(d => d.x);
    const allYValues = scatterDataArr.flat().map(d => d.y);

    const xStats = {
      min: Math.min(...allXValues),
      max: Math.max(...allXValues),
      mean: allXValues.reduce((a, b) => a + b, 0) / allXValues.length,
      std: 0
    };
    
    const yStats = {
      min: Math.min(...allYValues),
      max: Math.max(...allYValues),
      mean: allYValues.reduce((a, b) => a + b, 0) / allYValues.length,
      std: 0
    };
    
    // Calculate standard deviation
    xStats.std = Math.sqrt(allXValues.reduce((sum, x) => sum + Math.pow(x - xStats.mean, 2), 0) / allXValues.length);
    yStats.std = Math.sqrt(allYValues.reduce((sum, y) => sum + Math.pow(y - yStats.mean, 2), 0) / allYValues.length);

    // Smart padding based on standard deviation
    const xPadding = xStats.std * 0.1;
    const yPadding = yStats.std * 0.1;

    return {
      x: {
        min: xStats.min - xPadding,
        max: xStats.max + xPadding,
        dataMin: xStats.min,
        dataMax: xStats.max,
        mean: xStats.mean,
        std: xStats.std
      },
      y: {
        min: yStats.min - yPadding,
        max: yStats.max + yPadding,
        dataMin: yStats.min,
        dataMax: yStats.max,
        mean: yStats.mean,
        std: yStats.std
      }
    };
  }, [scatterDataArr]);

  // Enhanced domain calculations
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

  const getYDomain = useCallback(() => {
    if (zoomDomain.y) {
      return zoomDomain.y;
    }
    if (yMin !== undefined || yMax !== undefined) {
      const min = yMin !== undefined ? yMin : dataRanges.y.min;
      const max = yMax !== undefined ? yMax : dataRanges.y.max;
      return [min, max];
    }
    return [dataRanges.y.min, dataRanges.y.max];
  }, [zoomDomain, yMin, yMax, dataRanges]);

  // Enhanced zoom controls
  const handleZoomIn = useCallback(() => {
    const currentXDomain = zoomDomain.x || [dataRanges.x.min, dataRanges.x.max];
    const currentYDomain = zoomDomain.y || [dataRanges.y.min, dataRanges.y.max];
    
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
    const currentYDomain = zoomDomain.y || [dataRanges.y.min, dataRanges.y.max];
    
    const xCenter = (currentXDomain[0] + currentXDomain[1]) / 2;
    const yCenter = (currentYDomain[0] + currentYDomain[1]) / 2;
    const xRange = Math.min((currentXDomain[1] - currentXDomain[0]) * 1.8, dataRanges.x.max - dataRanges.x.min);
    const yRange = Math.min((currentYDomain[1] - currentYDomain[0]) * 1.8, dataRanges.y.max - dataRanges.y.min);
    
    setZoomDomain({
      x: [
        Math.max(dataRanges.x.min, xCenter - xRange / 2), 
        Math.min(dataRanges.x.max, xCenter + xRange / 2)
      ],
      y: [
        Math.max(dataRanges.y.min, yCenter - yRange / 2), 
        Math.min(dataRanges.y.max, yCenter + yRange / 2)
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

  // Enhanced tooltip with correlation info
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-sm transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-gray-900/95 border-gray-700 text-white' 
            : 'bg-white/95 border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <Target className="h-4 w-4 text-blue-500" />
            <p className="font-semibold text-sm">Data Point</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{xAxis}:</span>
              <span className="text-sm font-bold">{data.x?.toFixed(3)}</span>
            </div>
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold">{entry.value?.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

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
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            showGrid 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Toggle Grid"
        >
          <Filter className="h-4 w-4" />
        </button>
        <button
          onClick={handleExport}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Export Chart"
        >
          <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Point Size Control */}
      <div className="absolute top-3 left-3 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
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

      <ResponsiveContainer width={width} height={height}>
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
            domain={getYDomain()}
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
              domain={getYDomain()}
              tick={{ fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value, entry) => (
              <span style={{ fontSize: 12, fontWeight: 500, color: entry.color }}>
                {value}
              </span>
            )}
          />
          
          {/* Reference lines for means */}
          <ReferenceLine 
            x={dataRanges.x.mean} 
            stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'} 
            strokeDasharray="5 5" 
            strokeWidth={1}
            opacity={0.6}
          />
          <ReferenceLine 
            yAxisId="left"
            y={dataRanges.y.mean} 
            stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'} 
            strokeDasharray="5 5" 
            strokeWidth={1}
            opacity={0.6}
          />
          
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
      
      {/* Enhanced legend with statistics */}
      <div className="flex flex-wrap justify-center items-center space-x-4 mt-4">
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
        
        {optimizedData.length < data.length && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
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