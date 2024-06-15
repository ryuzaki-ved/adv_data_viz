import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Brush, 
  ReferenceLine, 
  Legend,
  Scatter
} from 'recharts';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  Download, 
  Settings, 
  TrendingUp, 
  Zap, 
  ZapOff,
  Plus,
  X,
  Eye,
  EyeOff,
  Palette,
  BarChart3,
  LineChart,
  Activity,
  ScatterChart as ScatterIcon
} from 'lucide-react';
import { DataPoint, ChartCombination } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface ComboChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  combinations: ChartCombination[];
  onCombinationsChange: (combinations: ChartCombination[]) => void;
  normalized?: boolean;
  width?: number | string;
  height?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  availableColumns: string[];
}

export const ComboChartComponent: React.FC<ComboChartComponentProps> = ({ 
  data, 
  xAxis, 
  combinations, 
  onCombinationsChange,
  normalized, 
  width = '100%', 
  height = 500, 
  xMin, 
  xMax, 
  yMin, 
  yMax,
  availableColumns
}) => {
  const { theme } = useTheme();
  const [zoomDomain, setZoomDomain] = useState<{ left?: number; right?: number }>({});
  const [brushDomain, setBrushDomain] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [showBrush, setShowBrush] = useState(data.length > 50);
  const [showGrid, setShowGrid] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [enableOptimization, setEnableOptimization] = useState(data.length > 1000);
  const [showCombinationControls, setShowCombinationControls] = useState(false);
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Enhanced color palettes
  const colorPalettes = {
    light: [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
      '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
    ],
    dark: [
      '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA',
      '#22D3EE', '#A3E635', '#FB923C', '#F472B6', '#818CF8',
      '#2DD4BF', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE'
    ],
    accent: [
      '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
      '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
    ]
  };
  
  const currentPalette = colorPalettes[theme];

  // Intelligent data optimization
  const optimizedData = useMemo(() => {
    if (!enableOptimization || data.length <= 1000) return data;
    
    const sampleSize = 1000;
    const step = data.length / sampleSize;
    const sampled = [];
    
    sampled.push(data[0]);
    
    for (let i = 1; i < data.length - 1; i += step) {
      const index = Math.floor(i);
      sampled.push(data[index]);
    }
    
    sampled.push(data[data.length - 1]);
    return sampled.slice(0, sampleSize);
  }, [data, enableOptimization]);

  // Calculate data ranges
  const dataRanges = useMemo(() => {
    const xValues = optimizedData.map(d => {
      const val = d[xAxis];
      return typeof val === 'number' ? val : parseFloat(String(val));
    }).filter(v => !isNaN(v));

    const leftAxisColumns = combinations.filter(c => c.yAxisId === 'left').map(c => c.column);
    const rightAxisColumns = combinations.filter(c => c.yAxisId === 'right').map(c => c.column);

    const leftYValues = leftAxisColumns.flatMap(col => 
      optimizedData.map(d => {
        const val = normalized ? d[`${col}_normalized`] : d[col];
        return typeof val === 'number' ? val : parseFloat(String(val));
      }).filter(v => !isNaN(v))
    );

    const rightYValues = rightAxisColumns.flatMap(col => 
      optimizedData.map(d => {
        const val = normalized ? d[`${col}_normalized`] : d[col];
        return typeof val === 'number' ? val : parseFloat(String(val));
      }).filter(v => !isNaN(v))
    );

    const xRange = xValues.length > 0 ? {
      min: Math.min(...xValues),
      max: Math.max(...xValues)
    } : { min: 0, max: 100 };

    const leftYRange = leftYValues.length > 0 ? {
      min: Math.min(...leftYValues),
      max: Math.max(...leftYValues)
    } : { min: 0, max: 100 };

    const rightYRange = rightYValues.length > 0 ? {
      min: Math.min(...rightYValues),
      max: Math.max(...rightYValues)
    } : { min: 0, max: 100 };

    const xPadding = (xRange.max - xRange.min) * 0.05;
    const leftYPadding = (leftYRange.max - leftYRange.min) * 0.1;
    const rightYPadding = (rightYRange.max - rightYRange.min) * 0.1;

    return {
      x: {
        min: xRange.min - xPadding,
        max: xRange.max + xPadding,
        dataMin: xRange.min,
        dataMax: xRange.max
      },
      leftY: {
        min: leftYRange.min - leftYPadding,
        max: leftYRange.max + leftYPadding,
        dataMin: leftYRange.min,
        dataMax: leftYRange.max
      },
      rightY: {
        min: rightYRange.min - rightYPadding,
        max: rightYRange.max + rightYPadding,
        dataMin: rightYRange.min,
        dataMax: rightYRange.max
      }
    };
  }, [optimizedData, xAxis, combinations, normalized]);

  // Domain calculations
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

  const getYDomain = useCallback((axis: 'left' | 'right') => {
    const range = axis === 'left' ? dataRanges.leftY : dataRanges.rightY;
    if (yMin !== undefined || yMax !== undefined) {
      const min = yMin !== undefined ? yMin : range.min;
      const max = yMax !== undefined ? yMax : range.max;
      return [min, max];
    }
    return [range.min, range.max];
  }, [yMin, yMax, dataRanges]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const currentDomain = zoomDomain;
    const dataLength = optimizedData.length;
    const left = currentDomain.left || 0;
    const right = currentDomain.right || dataLength - 1;
    const center = (left + right) / 2;
    const newRange = (right - left) * 0.6;
    
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
    const newRange = Math.min((right - left) * 1.8, dataLength);
    
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

  // Combination management
  const addCombination = useCallback(() => {
    const availableColumn = availableColumns.find(col => 
      !combinations.some(c => c.column === col)
    );
    
    if (!availableColumn) return;

    const newCombination: ChartCombination = {
      id: `combo-${Date.now()}`,
      column: availableColumn,
      chartType: 'line',
      yAxisId: 'left',
      color: currentPalette[combinations.length % currentPalette.length],
      strokeWidth: 2,
      opacity: 0.8,
      visible: true,
      normalized: false
    };

    onCombinationsChange([...combinations, newCombination]);
  }, [combinations, availableColumns, currentPalette, onCombinationsChange]);

  const updateCombination = useCallback((id: string, updates: Partial<ChartCombination>) => {
    const updatedCombinations = combinations.map(combo => 
      combo.id === id ? { ...combo, ...updates } : combo
    );
    onCombinationsChange(updatedCombinations);
  }, [combinations, onCombinationsChange]);

  const removeCombination = useCallback((id: string) => {
    if (combinations.length > 1) {
      onCombinationsChange(combinations.filter(combo => combo.id !== id));
    }
  }, [combinations, onCombinationsChange]);

  // Mouse events for data point info
  const handleMouseMove = useCallback((event: any) => {
    if (event && event.activePayload && event.activePayload.length > 0 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setHoveredData(event.activePayload[0].payload);
      setMousePosition({
        x: event.activeCoordinate?.x || 0,
        y: event.activeCoordinate?.y || 0
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
        link.download = 'combo-chart.png';
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }, []);

  // Chart type icons
  const getChartTypeIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'line': return <LineChart className="h-4 w-4" />;
      case 'area': return <Activity className="h-4 w-4" />;
      case 'scatter': return <ScatterIcon className="h-4 w-4" />;
      default: return <LineChart className="h-4 w-4" />;
    }
  };

  const isXAxisNumeric = typeof optimizedData[0]?.[xAxis] === 'number';
  const hasRightAxis = combinations.some(c => c.yAxisId === 'right');

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Chart Controls */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCombinationControls(!showCombinationControls)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showCombinationControls 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Toggle Combination Controls"
          >
            <Settings className="h-4 w-4 mr-2 inline" />
            Combinations
          </button>
          
          <button
            onClick={() => setShowBrush(!showBrush)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showBrush 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Toggle Navigation"
          >
            <Move className="h-4 w-4 mr-2 inline" />
            Navigation
          </button>
          
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showGrid 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Toggle Grid"
          >
            <Settings className="h-4 w-4 mr-2 inline" />
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

      {/* Combination Controls Panel */}
      {showCombinationControls && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chart Combinations</h3>
            <button
              onClick={addCombination}
              disabled={combinations.length >= availableColumns.length}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Combination</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {combinations.map((combo, index) => (
              <div key={combo.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Visibility Toggle */}
                  <div className="col-span-1">
                    <button
                      onClick={() => updateCombination(combo.id, { visible: !combo.visible })}
                      className={`p-2 rounded transition-all duration-200 ${
                        combo.visible 
                          ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' 
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {combo.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Column Selection */}
                  <div className="col-span-3">
                    <select
                      value={combo.column}
                      onChange={(e) => updateCombination(combo.id, { column: e.target.value })}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Chart Type */}
                  <div className="col-span-2">
                    <select
                      value={combo.chartType}
                      onChange={(e) => updateCombination(combo.id, { chartType: e.target.value as any })}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="line">Line</option>
                      <option value="bar">Bar</option>
                      <option value="area">Area</option>
                      <option value="scatter">Scatter</option>
                    </select>
                  </div>

                  {/* Y-Axis */}
                  <div className="col-span-2">
                    <select
                      value={combo.yAxisId}
                      onChange={(e) => updateCombination(combo.id, { yAxisId: e.target.value as 'left' | 'right' })}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="left">Left Axis</option>
                      <option value="right">Right Axis</option>
                    </select>
                  </div>

                  {/* Color Picker */}
                  <div className="col-span-1">
                    <input
                      type="color"
                      value={combo.color || currentPalette[index % currentPalette.length]}
                      onChange={(e) => updateCombination(combo.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      title="Change Color"
                    />
                  </div>

                  {/* Stroke Width */}
                  <div className="col-span-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={combo.strokeWidth || 2}
                      onChange={(e) => updateCombination(combo.id, { strokeWidth: Number(e.target.value) })}
                      className="w-full"
                      title="Stroke Width"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{combo.strokeWidth || 2}px</span>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1">
                    {combinations.length > 1 && (
                      <button
                        onClick={() => removeCombination(combo.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all duration-200"
                        title="Remove Combination"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Controls Row */}
                <div className="mt-3 flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={combo.normalized || false}
                      onChange={(e) => updateCombination(combo.id, { normalized: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Normalized</span>
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Opacity:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={combo.opacity || 0.8}
                      onChange={(e) => updateCombination(combo.id, { opacity: Number(e.target.value) })}
                      className="w-20"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round((combo.opacity || 0.8) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="w-full" style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            ref={chartRef}
            data={optimizedData} 
            margin={{ top: 20, right: 50, left: 20, bottom: showBrush ? 80 : 20 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {/* Gradients for area charts */}
              {combinations.map((combo, index) => (
                combo.chartType === 'area' && (
                  <linearGradient key={`areaGradient-${combo.id}`} id={`areaGradient-${combo.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={combo.color || currentPalette[index % currentPalette.length]} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={combo.color || currentPalette[index % currentPalette.length]} stopOpacity="0.05" />
                  </linearGradient>
                )
              ))}
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
              domain={getYDomain('left')}
              tick={{ fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            
            {hasRightAxis && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: theme === 'dark' ? '#4B5563' : '#D1D5DB', strokeWidth: 1 }}
                domain={getYDomain('right')}
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
            )}
            
            <Tooltip content={() => null} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry) => (
                <span style={{ fontSize: 12, fontWeight: 500, color: entry.color }}>
                  {value}
                </span>
              )}
            />
            
            {/* Render chart combinations */}
            {combinations.map((combo, index) => {
              if (!combo.visible) return null;
              
              const dataKey = combo.normalized ? `${combo.column}_normalized` : combo.column;
              const color = combo.color || currentPalette[index % currentPalette.length];
              const strokeWidth = combo.strokeWidth || 2;
              const opacity = combo.opacity || 0.8;
              
              switch (combo.chartType) {
                case 'bar':
                  return (
                    <Bar
                      key={combo.id}
                      dataKey={dataKey}
                      fill={color}
                      fillOpacity={opacity}
                      yAxisId={combo.yAxisId}
                      name={combo.normalized ? `${combo.column} (normalized)` : combo.column}
                      animationBegin={showAnimation ? index * 100 : 0}
                      animationDuration={showAnimation ? 800 : 0}
                    />
                  );
                  
                case 'line':
                  return (
                    <Line
                      key={combo.id}
                      type="monotone"
                      dataKey={dataKey}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      dot={false}
                      yAxisId={combo.yAxisId}
                      name={combo.normalized ? `${combo.column} (normalized)` : combo.column}
                      animationBegin={showAnimation ? index * 200 : 0}
                      animationDuration={showAnimation ? 1000 : 0}
                    />
                  );
                  
                case 'area':
                  return (
                    <Area
                      key={combo.id}
                      type="monotone"
                      dataKey={dataKey}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      fill={`url(#areaGradient-${combo.id})`}
                      fillOpacity={opacity}
                      yAxisId={combo.yAxisId}
                      name={combo.normalized ? `${combo.column} (normalized)` : combo.column}
                      animationBegin={showAnimation ? index * 200 : 0}
                      animationDuration={showAnimation ? 1200 : 0}
                    />
                  );
                  
                case 'scatter':
                  const scatterData = optimizedData.map(item => ({
                    x: item[xAxis],
                    y: item[dataKey]
                  })).filter(item => !isNaN(Number(item.x)) && !isNaN(Number(item.y)));
                  
                  return (
                    <Scatter
                      key={combo.id}
                      data={scatterData}
                      fill={color}
                      fillOpacity={opacity}
                      yAxisId={combo.yAxisId}
                      name={combo.normalized ? `${combo.column} (normalized)` : combo.column}
                    />
                  );
                  
                default:
                  return null;
              }
            })}
            
            {/* Brush */}
            {showBrush && (
              <Brush
                dataKey={xAxis}
                height={40}
                stroke={currentPalette[0]}
                fill={theme === 'dark' ? '#374151' : '#F3F4F6'}
                onChange={handleBrushChange}
                startIndex={brushDomain.startIndex}
                endIndex={brushDomain.endIndex}
                tickFormatter={(value) => String(value).substring(0, 10)}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Floating Data Point Card */}
      {hoveredData && (
        <div 
          className={`absolute z-50 pointer-events-none transition-all duration-200 ${
            theme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700 text-white' 
              : 'bg-white/95 border-gray-200 text-gray-900'
          } backdrop-blur-md rounded-lg border shadow-xl px-3 py-2 min-w-40`}
          style={{
            left: Math.min(mousePosition.x + 15, (containerRef.current?.offsetWidth || 0) - 200),
            top: Math.max(mousePosition.y - 80, 10),
            transform: 'translateZ(0)'
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{xAxis}</span>
              <span className="text-sm font-bold">
                {typeof hoveredData[xAxis] === 'number' 
                  ? hoveredData[xAxis].toFixed(2) 
                  : hoveredData[xAxis]
                }
              </span>
            </div>
            
            {combinations.filter(c => c.visible).map((combo, index) => {
              const dataKey = combo.normalized ? `${combo.column}_normalized` : combo.column;
              return (
                <div key={combo.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getChartTypeIcon(combo.chartType)}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {combo.normalized ? `${combo.column} (norm)` : combo.column}
                    </span>
                  </div>
                  <span 
                    className="text-sm font-bold"
                    style={{ color: combo.color || currentPalette[index % currentPalette.length] }}
                  >
                    {typeof hoveredData[dataKey] === 'number' 
                      ? hoveredData[dataKey].toFixed(3)
                      : hoveredData[dataKey]
                    }
                  </span>
                </div>
              );
            })}
          </div>
          
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
      
      {/* Enhanced legend with combination info */}
      <div className="flex flex-wrap justify-center items-center space-x-6 mt-6 text-xs">
        {combinations.filter(c => c.visible).map((combo, idx) => (
          <div key={combo.id} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
            {getChartTypeIcon(combo.chartType)}
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: combo.color || currentPalette[idx % currentPalette.length] }}
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {combo.normalized ? `${combo.column} (normalized)` : combo.column}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              ({combo.yAxisId})
            </span>
          </div>
        ))}
        
        {enableOptimization && optimizedData.length < data.length && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
            Optimized: {optimizedData.length.toLocaleString()} of {data.length.toLocaleString()} points
          </div>
        )}
      </div>
    </div>
  );
};