import React from 'react';
import { BarChart3, LineChart, PieChart, ScatterChart as Scatter, Grid3x3, Target, Plus, X } from 'lucide-react';
import { ChartConfig, ChartType, ColumnInfo } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ChartControlsProps {
  columns: ColumnInfo[];
  configs: ChartConfig[];
  onConfigsChange: (configs: ChartConfig[]) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({ columns, configs, onConfigsChange }) => {
  const { theme } = useTheme();

  const chartTypes: { key: ChartType; icon: React.ReactNode; label: string }[] = [
    { key: 'bar', icon: <BarChart3 className="h-4 w-4" />, label: 'Bar' },
    { key: 'line', icon: <LineChart className="h-4 w-4" />, label: 'Line' },
    { key: 'pie', icon: <PieChart className="h-4 w-4" />, label: 'Pie' },
    { key: 'scatter', icon: <Scatter className="h-4 w-4" />, label: 'Scatter' },
    { key: 'heatmap', icon: <Grid3x3 className="h-4 w-4" />, label: 'Heatmap' },
    { key: 'footprint', icon: <Target className="h-4 w-4" />, label: 'Footprint' }
  ];

  const numericColumns = columns.filter(col => col.type === 'numeric');

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          card: 'bg-gray-800 border-gray-700',
          input: 'bg-gray-700 border-gray-600 text-white',
          button: 'bg-gray-700 text-white hover:bg-gray-600',
          activeButton: 'bg-blue-600 text-white shadow-lg',
          deleteButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'accent':
        return {
          card: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200',
          input: 'bg-white border-purple-200 text-purple-900',
          button: 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200',
          activeButton: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg',
          deleteButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
      default:
        return {
          card: 'bg-white border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900',
          button: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          activeButton: 'bg-blue-600 text-white shadow-lg',
          deleteButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const addNewChart = () => {
    const firstCategorical = columns.find(col => col.type === 'categorical');
    const firstNumeric = columns.find(col => col.type === 'numeric');
    
    const newConfig: ChartConfig = {
      id: `chart-${Date.now()}`,
      xAxis: firstCategorical?.name || columns[0]?.name || '',
      yAxis: firstNumeric?.name || columns[1]?.name || '',
      chartType: 'bar',
      normalized: false,
      title: `Chart ${configs.length + 1}`
    };
    
    onConfigsChange([...configs, newConfig]);
  };

  const updateConfig = (id: string, updates: Partial<ChartConfig>) => {
    const updatedConfigs = configs.map(config => 
      config.id === id ? { ...config, ...updates } : config
    );
    onConfigsChange(updatedConfigs);
  };

  const removeConfig = (id: string) => {
    if (configs.length > 1) {
      onConfigsChange(configs.filter(config => config.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chart Configuration</h3>
        <button
          onClick={addNewChart}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${themeClasses.activeButton}`}
        >
          <Plus className="h-4 w-4" />
          <span>Add Chart</span>
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {configs.map((config, index) => (
          <div key={config.id} className={`p-4 rounded-xl border ${themeClasses.card} space-y-4`}>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => updateConfig(config.id, { title: e.target.value })}
                placeholder={`Chart ${index + 1}`}
                className={`text-sm font-medium bg-transparent border-none outline-none ${
                  theme === 'dark' ? 'text-white' : theme === 'accent' ? 'text-purple-900' : 'text-gray-900'
                }`}
              />
              {configs.length > 1 && (
                <button
                  onClick={() => removeConfig(config.id)}
                  className={`p-1 rounded ${themeClasses.deleteButton}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Chart Type Selection */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Chart Type</label>
              <div className="grid grid-cols-3 gap-1">
                {chartTypes.map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => updateConfig(config.id, { chartType: key })}
                    className={`p-2 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
                      config.chartType === key ? themeClasses.activeButton : themeClasses.button
                    }`}
                  >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Axis Configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>X-Axis</label>
                <select
                  value={config.xAxis}
                  onChange={(e) => updateConfig(config.id, { xAxis: e.target.value })}
                  className={`w-full p-2 rounded border text-xs ${themeClasses.input} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                >
                  {columns.map(column => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Y-Axis</label>
                <select
                  value={Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis}
                  onChange={(e) => updateConfig(config.id, { yAxis: e.target.value })}
                  className={`w-full p-2 rounded border text-xs ${themeClasses.input} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                >
                  {numericColumns.map(column => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Normalization Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`normalize-${config.id}`}
                checked={config.normalized}
                onChange={(e) => updateConfig(config.id, { normalized: e.target.checked })}
                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`normalize-${config.id}`} className={`text-xs font-medium cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Normalize data
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Single chart control component
export const ChartControlSingle: React.FC<{
  config: ChartConfig;
  columns: ColumnInfo[];
  numericColumns: ColumnInfo[];
  onUpdate: (updates: Partial<ChartConfig>) => void;
  onRemove: () => void;
  theme: string;
  disableRemove?: boolean;
}> = ({ config, columns, numericColumns, onUpdate, onRemove, theme, disableRemove }) => {
  const chartTypes: { key: ChartType; icon: React.ReactNode; label: string }[] = [
    { key: 'bar', icon: <BarChart3 className="h-4 w-4" />, label: 'Bar' },
    { key: 'line', icon: <LineChart className="h-4 w-4" />, label: 'Line' },
    { key: 'pie', icon: <PieChart className="h-4 w-4" />, label: 'Pie' },
    { key: 'scatter', icon: <Scatter className="h-4 w-4" />, label: 'Scatter' },
    { key: 'heatmap', icon: <Grid3x3 className="h-4 w-4" />, label: 'Heatmap' },
    { key: 'footprint', icon: <Target className="h-4 w-4" />, label: 'Footprint' }
  ];

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          card: 'bg-gray-800 border-gray-700',
          input: 'bg-gray-700 border-gray-600 text-white',
          button: 'bg-gray-700 text-white hover:bg-gray-600',
          activeButton: 'bg-blue-600 text-white shadow-lg',
          deleteButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'accent':
        return {
          card: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200',
          input: 'bg-white border-purple-200 text-purple-900',
          button: 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200',
          activeButton: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg',
          deleteButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
      default:
        return {
          card: 'bg-white border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900',
          button: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          activeButton: 'bg-blue-600 text-white shadow-lg',
          deleteButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
    }
  };
  const themeClasses = getThemeClasses();

  // Helper to determine if multi-Y is supported
  const supportsMultiY = ['bar', 'line', 'scatter'].includes(config.chartType);
  const yAxisArray = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis];
  const maxY = 3;
  const handleYCheckbox = (colName: string) => {
    let newY: string[];
    if (yAxisArray.includes(colName)) {
      newY = yAxisArray.filter(y => y !== colName);
    } else {
      if (yAxisArray.length >= maxY) return; // Prevent more than maxY
      newY = [...yAxisArray, colName];
    }
    // If only one selected, store as string for compatibility
    onUpdate({ yAxis: newY.length === 1 ? newY[0] : newY });
  };

  // Defaults and min/max from config or fallback
  const minW = config.minW ?? 200, maxW = config.maxW ?? 1000, minH = config.minH ?? 200, maxH = config.maxH ?? 700;
  const width = config.width ?? 0; // 0 means 100%
  const height = config.height ?? 350;
  // Auto-fit logic: set width to 100%, height to 50 + N*10 (clamped)
  const handleAutoFit = () => {
    const autoHeight = Math.max(minH, Math.min(maxH, 50 + (config.dataLength ?? 30) * 10));
    onUpdate({ width: 0, height: autoHeight });
  };

  // Axis min/max controls as sliders
  const xMin = config.xMin;
  const xMax = config.xMax;
  const yMin = config.yMin;
  const yMax = config.yMax;
  // For slider ranges, use data min/max or sensible defaults
  const xDataMin = config.xDataMin ?? 0;
  const xDataMax = config.xDataMax ?? 100;
  const yDataMin = config.yDataMin ?? 0;
  const yDataMax = config.yDataMax ?? 100;
  const handleResetAxes = () => {
    onUpdate({ xMin: undefined, xMax: undefined, yMin: undefined, yMax: undefined });
  };

  return (
    <div className={`p-6 rounded-xl border ${themeClasses.card} space-y-6`}>
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={config.title || ''}
          className={`text-lg font-semibold bg-transparent border-none outline-none ${
            theme === 'dark' ? 'text-white' : theme === 'accent' ? 'text-purple-900' : 'text-gray-900'
          }`}
        />
        {!disableRemove && (
          <button
            onClick={onRemove}
            className={`p-2 rounded ${themeClasses.deleteButton}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Chart Type Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Chart Type</label>
            <div className="grid grid-cols-3 gap-2">
              {chartTypes.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => onUpdate({ chartType: key })}
                  className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                    config.chartType === key ? themeClasses.activeButton : themeClasses.button
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Axis Configuration */}
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>X-Axis</label>
              <select
                value={config.xAxis}
                onChange={(e) => onUpdate({ xAxis: e.target.value })}
                className={`w-full p-3 rounded-lg border text-sm ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                {columns.map(column => (
                  <option key={column.name} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Y-Axis{supportsMultiY ? ' (up to 3)' : ''}
              </label>
              {supportsMultiY ? (
                <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded-lg border-gray-300 dark:border-gray-600">
                  {numericColumns.map(column => (
                    <label key={column.name} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={yAxisArray.includes(column.name)}
                        onChange={() => handleYCheckbox(column.name)}
                        disabled={!yAxisArray.includes(column.name) && yAxisArray.length >= maxY}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{column.name}</span>
                    </label>
                  ))}
                  {yAxisArray.length >= maxY && (
                    <span className="text-red-500 text-xs mt-1">Max {maxY} columns</span>
                  )}
                </div>
              ) : (
                <select
                  value={Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis}
                  onChange={(e) => onUpdate({ yAxis: e.target.value })}
                  className={`w-full p-3 rounded-lg border text-sm ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  {numericColumns.map(column => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Normalization Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={`normalize-${config.id}`}
              checked={config.normalized}
              onChange={(e) => onUpdate({ normalized: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`normalize-${config.id}`} className={`text-sm font-medium cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Normalize data
            </label>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Chart Size Controls */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Chart Size</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className={`text-xs font-medium w-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Width</label>
                <input
                  type="range"
                  min={minW}
                  max={maxW}
                  value={width === 0 ? maxW : width}
                  onChange={e => onUpdate({ width: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className={`text-xs w-16 text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {width === 0 ? 'Auto' : `${width}px`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className={`text-xs font-medium w-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Height</label>
                <input
                  type="range"
                  min={minH}
                  max={maxH}
                  value={height}
                  onChange={e => onUpdate({ height: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className={`text-xs w-16 text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {height}px
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFit}
                className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition"
              >
                Auto-Fit Chart
              </button>
            </div>
          </div>

          {/* Axis Min/Max Controls */}
          {config.chartType !== 'pie' && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Axis Ranges</label>
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>X-Axis Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={xDataMin}
                      max={xDataMax}
                      value={xMin === undefined ? xDataMin : xMin}
                      onChange={e => onUpdate({ xMin: Number(e.target.value) })}
                      className="flex-1"
                      disabled={xMax !== undefined && xMin !== undefined && xMin >= xMax}
                    />
                    <span className={`text-xs w-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {xMin === undefined ? 'Auto' : xMin}
                    </span>
                    <input
                      type="range"
                      min={xDataMin}
                      max={xDataMax}
                      value={xMax === undefined ? xDataMax : xMax}
                      onChange={e => onUpdate({ xMax: Number(e.target.value) })}
                      className="flex-1"
                      disabled={xMin !== undefined && xMax !== undefined && xMax <= xMin}
                    />
                    <span className={`text-xs w-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {xMax === undefined ? 'Auto' : xMax}
                    </span>
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Y-Axis Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={yDataMin}
                      max={yDataMax}
                      value={yMin === undefined ? yDataMin : yMin}
                      onChange={e => onUpdate({ yMin: Number(e.target.value) })}
                      className="flex-1"
                      disabled={yMax !== undefined && yMin !== undefined && yMin >= yMax}
                    />
                    <span className={`text-xs w-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {yMin === undefined ? 'Auto' : yMin}
                    </span>
                    <input
                      type="range"
                      min={yDataMin}
                      max={yDataMax}
                      value={yMax === undefined ? yDataMax : yMax}
                      onChange={e => onUpdate({ yMax: Number(e.target.value) })}
                      className="flex-1"
                      disabled={yMin !== undefined && yMax !== undefined && yMax <= yMin}
                    />
                    <span className={`text-xs w-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {yMax === undefined ? 'Auto' : yMax}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetAxes}
                  className="w-full px-3 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-sm text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Reset Axes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};