import React, { useState, useRef, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { Download, Eye, EyeOff, RotateCcw, Maximize2, PieChart as PieIcon } from 'lucide-react';
import { DataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface PieChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string | string[];
  normalized?: boolean;
  width?: number | string;
  height?: number;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({ 
  data, xAxis, yAxis, normalized, width = 300, height = 300 
}) => {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hiddenSlices, setHiddenSlices] = useState<Set<string>>(new Set());
  const [showLabels, setShowLabels] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'none'>('value');
  const chartRef = useRef<any>(null);
  
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis];
  
  // Enhanced color palettes with better contrast
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

  // Process data for each pie chart
  const processedData = useMemo(() => {
    return yKeys.map(y => {
      const yKey = normalized ? `${y}_normalized` : y;
      
      // Aggregate data by category
      const aggregatedData = data.reduce((acc, item) => {
        const category = String(item[xAxis]);
        const value = Number(item[yKey]);
        
        if (!isNaN(value)) {
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += value;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Convert to array format
      let pieData = Object.entries(aggregatedData).map(([name, value]) => ({
        name,
        value,
        percentage: 0, // Will be calculated after sorting
        originalValue: value
      }));
      
      // Sort data
      if (sortBy === 'value') {
        pieData.sort((a, b) => b.value - a.value);
      } else if (sortBy === 'name') {
        pieData.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      // Calculate percentages
      const total = pieData.reduce((sum, item) => sum + item.value, 0);
      pieData = pieData.map(item => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0
      }));
      
      // Filter out hidden slices
      const visibleData = pieData.filter(item => !hiddenSlices.has(`${y}-${item.name}`));
      
      return {
        key: y,
        data: visibleData,
        total,
        hiddenCount: pieData.length - visibleData.length
      };
    });
  }, [data, xAxis, yKeys, normalized, sortBy, hiddenSlices]);

  // Toggle slice visibility
  const toggleSliceVisibility = useCallback((seriesKey: string, sliceName: string) => {
    const key = `${seriesKey}-${sliceName}`;
    const newHidden = new Set(hiddenSlices);
    
    if (newHidden.has(key)) {
      newHidden.delete(key);
    } else {
      newHidden.add(key);
    }
    
    setHiddenSlices(newHidden);
  }, [hiddenSlices]);

  // Reset all hidden slices
  const resetVisibility = useCallback(() => {
    setHiddenSlices(new Set());
    setActiveIndex(null);
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
        link.download = 'pie-chart.png';
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }, []);

  // Enhanced tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`p-4 rounded-xl shadow-2xl border backdrop-blur-sm transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-gray-900/95 border-gray-700 text-white' 
            : 'bg-white/95 border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <PieIcon className="h-4 w-4 text-blue-500" />
            <p className="font-semibold text-sm">{data.name}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center space-x-4">
              <span className="text-sm font-medium">Value:</span>
              <span className="text-sm font-bold">
                {data.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
            <div className="flex justify-between items-center space-x-4">
              <span className="text-sm font-medium">Percentage:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {data.payload.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Active shape for hover effect
  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-semibold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
            transition: 'all 0.3s ease-out'
          }}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
          opacity={0.8}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey} 
          textAnchor={textAnchor} 
          fill={theme === 'dark' ? '#FFFFFF' : '#111827'}
          className="text-sm font-semibold"
        >
          {`${value.toLocaleString()}`}
        </text>
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey} 
          dy={18} 
          textAnchor={textAnchor} 
          fill={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
          className="text-xs"
        >
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  // Custom label function with smart positioning
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null; // Hide labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Smart label positioning to avoid overlap
    const labelText = `${(percent * 100).toFixed(0)}%`;
    const isLongLabel = name && name.length > 8;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={theme === 'dark' ? '#FFFFFF' : '#111827'}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          fontSize: isLongLabel ? '10px' : '12px'
        }}
      >
        {labelText}
      </text>
    );
  };

  return (
    <div className="relative group">
      {/* Enhanced Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            showLabels 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Toggle Labels"
        >
          {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={resetVisibility}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleExport}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          title="Export Chart"
        >
          <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Sort Controls */}
      <div className="absolute top-3 left-3 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'value' | 'name' | 'none')}
          className="text-xs px-2 py-1 rounded bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
        >
          <option value="value">Sort by Value</option>
          <option value="name">Sort by Name</option>
          <option value="none">No Sort</option>
        </select>
      </div>

      <div className="flex flex-col items-center w-full">
        <div className={`flex flex-row justify-center items-start w-full gap-8 ${
          yKeys.length > 2 ? 'flex-wrap' : ''
        }`}>
          {processedData.map((series, seriesIndex) => (
            <div key={series.key} className="flex flex-col items-center">
              <ResponsiveContainer width={width} height={height}>
                <PieChart ref={seriesIndex === 0 ? chartRef : undefined}>
                  <Pie
                    data={series.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={showLabels ? renderCustomLabel : false}
                    outerRadius={Math.min(Number(width) || 300, Number(height) || 300) * 0.35}
                    innerRadius={Math.min(Number(width) || 300, Number(height) || 300) * 0.15}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={showAnimation ? seriesIndex * 200 : 0}
                    animationDuration={showAnimation ? 800 : 0}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {series.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={currentPalette[index % currentPalette.length]}
                        stroke={theme === 'dark' ? '#374151' : '#FFFFFF'}
                        strokeWidth={2}
                        style={{
                          filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                          transition: 'all 0.3s ease-out',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Series Title and Stats */}
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {normalized ? `${series.key} (normalized)` : series.key}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Total: {series.total.toLocaleString()}</div>
                  <div>{series.data.length} categories</div>
                  {series.hiddenCount > 0 && (
                    <div className="text-orange-600 dark:text-orange-400">
                      {series.hiddenCount} hidden
                    </div>
                  )}
                </div>
              </div>
              
              {/* Interactive Legend with smart wrapping */}
              <div className="mt-4 max-w-xs">
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                  {processedData[seriesIndex].data.map((entry, index) => {
                    const isHidden = hiddenSlices.has(`${series.key}-${entry.name}`);
                    const displayName = entry.name.length > 15 ? `${entry.name.substring(0, 15)}...` : entry.name;
                    
                    return (
                      <button
                        key={entry.name}
                        onClick={() => toggleSliceVisibility(series.key, entry.name)}
                        className={`flex items-center justify-between space-x-2 px-2 py-1 rounded text-xs transition-all duration-200 ${
                          isHidden 
                            ? 'opacity-50 bg-gray-100 dark:bg-gray-800' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={entry.name} // Show full name on hover
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: currentPalette[index % currentPalette.length] }}
                          />
                          <span className="truncate font-medium text-gray-900 dark:text-white">
                            {displayName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {entry.percentage.toFixed(1)}%
                          </span>
                          {isHidden ? (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          ) : (
                            <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};