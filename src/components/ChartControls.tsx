import React from 'react';
import { BarChart3, LineChart, PieChart, ScatterChart as Scatter, Grid3x3, Target, Plus, X, Layers, Activity, TrendingUp } from 'lucide-react';
import { ChartConfig, ChartType, ColumnInfo, ChartCombination } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ChartControlsProps {
  columns: ColumnInfo[];
  configs: ChartConfig[];
  onConfigsChange: (configs: ChartConfig[]) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({ columns, configs, onConfigsChange }) => {
  const { theme } = useTheme();

  // Global axis order scope state
  const [globalAxisOrder, setGlobalAxisOrder] = React.useState(false);

  const chartTypes: { key: ChartType; icon: React.ReactNode; label: string }[] = [
    { key: 'bar', icon: <BarChart3 className="h-4 w-4" />, label: 'Bar' },
    { key: 'line', icon: <LineChart className="h-4 w-4" />, label: 'Line' },
    { key: 'pie', icon: <PieChart className="h-4 w-4" />, label: 'Pie' },
    { key: 'scatter', icon: <Scatter className="h-4 w-4" />, label: 'Scatter' },
    { key: 'heatmap', icon: <Grid3x3 className="h-4 w-4" />, label: 'Heatmap' },
    { key: 'footprint', icon: <Target className="h-4 w-4" />, label: 'Footprint' },
    { key: 'orderflow', icon: <Activity className="h-4 w-4" />, label: 'Orderflow' }
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
          deleteButton: 'bg-red-600 hover:bg-red-700 text-white',
          comboButton: 'bg-purple-600 hover:bg-purple-700 text-white',
          orderflowButton: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'accent':
        return {
          card: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200',
          input: 'bg-white border-purple-200 text-purple-900',
          button: 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200',
          activeButton: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg',
          deleteButton: 'bg-red-500 hover:bg-red-600 text-white',
          comboButton: 'bg-purple-500 hover:bg-purple-600 text-white',
          orderflowButton: 'bg-green-500 hover:bg-green-600 text-white'
        };
      default:
        return {
          card: 'bg-white border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900',
          button: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          activeButton: 'bg-blue-600 text-white shadow-lg',
          deleteButton: 'bg-red-500 hover:bg-red-600 text-white',
          comboButton: 'bg-purple-500 hover:bg-purple-600 text-white',
          orderflowButton: 'bg-green-500 hover:bg-green-600 text-white'
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
      title: `Chart ${configs.length + 1}`,
      xOrder: 'file',
      yOrder: 'file'
    };
    
    onConfigsChange([...configs, newConfig]);
  };

  const addComboChart = () => {
    const firstCategorical = columns.find(col => col.type === 'categorical');
    const availableNumericColumns = numericColumns.slice(0, 3); // Limit to first 3 for initial setup
    
    const defaultCombinations: ChartCombination[] = availableNumericColumns.map((col, index) => ({
      id: `combo-${Date.now()}-${index}`,
      column: col.name,
      chartType: index === 0 ? 'bar' : 'line',
      yAxisId: index < 2 ? 'left' : 'right',
      color: undefined, // Will be set by the component
      strokeWidth: 2,
      opacity: 0.8,
      visible: true,
      normalized: false
    }));

    const newConfig: ChartConfig = {
      id: `chart-${Date.now()}`,
      xAxis: firstCategorical?.name || columns[0]?.name || '',
      yAxis: availableNumericColumns.map(col => col.name),
      chartType: 'bar', // This will be ignored for combo charts
      normalized: false,
      title: `Combo Chart ${configs.length + 1}`,
      xOrder: 'file',
      yOrder: 'file',
      isMultiChart: true,
      chartCombinations: defaultCombinations
    };
    
    onConfigsChange([...configs, newConfig]);
  };

  // Generate mock orderflow data
  const generateMockOrderflowData = () => {
    const data = [];
    const basePrice = 100;
    
    for (let i = 0; i < 50; i++) {
      const price = basePrice + (i * 0.25);
      const bidVolume = Math.floor(Math.random() * 1000) + 100;
      const askVolume = Math.floor(Math.random() * 1000) + 100;
      
      data.push({
        price: price,
        bidVolume: bidVolume,
        askVolume: askVolume,
        delta: askVolume - bidVolume,
        time: new Date().toISOString()
      });
    }
    
    return data;
  };

  const addOrderflowChart = () => {
    // Generate mock data for orderflow chart
    const mockData = generateMockOrderflowData();
    
    // Store mock data globally for the orderflow chart to access
    (window as any).__MOCK_ORDERFLOW_DATA__ = mockData;
    
    const newConfig: ChartConfig = {
      id: `chart-${Date.now()}`,
      xAxis: 'price',
      yAxis: 'bidVolume',
      chartType: 'orderflow',
      normalized: false,
      title: `Orderflow Chart ${configs.length + 1}`,
      xOrder: 'file',
      yOrder: 'file',
      width: 600,
      height: 400
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
      {/* Global axis order scope control */}
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="global-axis-order"
          checked={globalAxisOrder}
          onChange={e => {
            setGlobalAxisOrder(e.target.checked);
            onConfigsChange([{ __globalSort__: e.target.checked }, ...configs]);
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
        />
        <label htmlFor="global-axis-order" className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
          Apply axis order to all charts
        </label>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chart Configuration</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={addNewChart}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${themeClasses.activeButton}`}
          >
            <Plus className="h-4 w-4" />
            <span>Add Chart</span>
          </button>
          <button
            onClick={addComboChart}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${themeClasses.comboButton}`}
          >
            <Layers className="h-4 w-4" />
            <span>Add Combo</span>
          </button>
          <button
            onClick={addOrderflowChart}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${themeClasses.orderflowButton}`}
          >
            <Activity className="h-4 w-4" />
            <span>Orderflow</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {configs.map((config, index) => (
          <div key={config.id} className={`p-4 rounded-xl border ${themeClasses.card} space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => updateConfig(config.id, { title: e.target.value })}
                  placeholder={`Chart ${index + 1}`}
                  className={`text-sm font-medium bg-transparent border-none outline-none ${
                    theme === 'dark' ? 'text-white' : theme === 'accent' ? 'text-purple-900' : 'text-gray-900'
                  }`}
                />
                {config.isMultiChart && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
                    COMBO
                  </span>
                )}
                {config.chartType === 'orderflow' && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                    ORDERFLOW
                  </span>
                )}
              </div>
              {configs.length > 1 && (
                <button
                  onClick={() => removeConfig(config.id)}
                  className={`p-1 rounded ${themeClasses.deleteButton}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {!config.isMultiChart && config.chartType !== 'orderflow' && (
              <>
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
                    {/* X-Axis Order */}
                    <label className={`block text-xs font-medium mt-2 mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>X-Axis Order</label>
                    <select
                      value={config.xOrder || 'file'}
                      onChange={e => updateConfig(config.id, { xOrder: e.target.value })}
                      className={`w-full p-2 rounded border text-xs ${themeClasses.input} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="file">As in file</option>
                      <option value="ascending">Ascending</option>
                      <option value="descending">Descending</option>
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
                    {/* Y-Axis Order */}
                    <label className={`block text-xs font-medium mt-2 mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Y-Axis Order</label>
                    <select
                      value={config.yOrder || 'file'}
                      onChange={e => updateConfig(config.id, { yOrder: e.target.value })}
                      className={`w-full p-2 rounded border text-xs ${themeClasses.input} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="file">As in file</option>
                      <option value="ascending">Ascending</option>
                      <option value="descending">Descending</option>
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
              </>
            )}

            {config.isMultiChart && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Multi-Chart Configuration
                  </span>
                </div>
                
                {/* X-Axis for combo chart */}
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

                <div className={`p-3 rounded-lg border-2 border-dashed ${
                  theme === 'dark' ? 'border-purple-600 bg-purple-900/10' : 'border-purple-300 bg-purple-50'
                }`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                    Chart combinations will be configured in the chart view. 
                    You can mix different chart types (bars, lines, areas, scatter) for different columns.
                  </p>
                </div>
              </div>
            )}

            {config.chartType === 'orderflow' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Orderflow Chart Configuration
                  </span>
                </div>

                <div className={`p-3 rounded-lg border-2 border-dashed ${
                  theme === 'dark' ? 'border-green-600 bg-green-900/10' : 'border-green-300 bg-green-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className={`font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                      Orderflow Features:
                    </span>
                  </div>
                  <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                    <li>• Displays bid/ask volume at each price level</li>
                    <li>• Shows order flow imbalances and delta</li>
                    <li>• Interactive price level analysis</li>
                    <li>• Real-time market depth visualization</li>
                    <li>• Professional trading interface</li>
                  </ul>
                </div>
              </div>
            )}
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
    { key: 'footprint', icon: <Target className="h-4 w-4" />, label: 'Footprint' },
    { key: 'orderflow', icon: <Activity className="h-4 w-4" />, label: 'Orderflow' }
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
  const xMin = config.xMin;
  const xMax = config.xMax;
  const yMin = config.yMin;
  const yMax = config.yMax;
  // For slider ranges, use static sensible defaults
  const xDataMin = 0;
  const xDataMax = 100;
  const yDataMin = 0;
  const yDataMax = 100;
  
  const handleResetAxes = () => {
    onUpdate({ xMin: undefined, xMax: undefined, yMin: undefined, yMax: undefined });
  };

  // Auto-fit logic: set width to 100%, height to 50 + N*10 (clamped)
  const handleAutoFit = () => {
    const autoHeight = Math.max(minH, Math.min(maxH, 50 + (config.dataLength ?? 30) * 10));
    onUpdate({ width: 0, height: autoHeight });
  };

  return (
    <div className={`p-6 rounded-xl border ${themeClasses.card} space-y-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={config.title || ''}
            className={`text-lg font-semibold bg-transparent border-none outline-none ${
              theme === 'dark' ? 'text-white' : theme === 'accent' ? 'text-purple-900' : 'text-gray-900'
            }`}
          />
          {config.isMultiChart && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
              COMBO
            </span>
          )}
          {config.chartType === 'orderflow' && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
              ORDERFLOW
            </span>
          )}
        </div>
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
          {!config.isMultiChart && config.chartType !== 'orderflow' && (
            <>
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
                  {/* X-Axis Order */}
                  <label className={`block text-sm font-medium mt-2 mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>X-Axis Order</label>
                  <select
                    value={config.xOrder || 'file'}
                    onChange={e => onUpdate({ xOrder: e.target.value })}
                    className={`w-full p-3 rounded-lg border text-sm ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="file">As in file</option>
                    <option value="ascending">Ascending</option>
                    <option value="descending">Descending</option>
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
                    <div className="space-y-2">
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
                      {/* Y-Axis Order */}
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Y-Axis Order</label>
                        <select
                          value={config.yOrder || 'file'}
                          onChange={e => onUpdate({ yOrder: e.target.value })}
                          className={`w-full p-3 rounded-lg border text-sm ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        >
                          <option value="file">As in file</option>
                          <option value="ascending">Ascending</option>
                          <option value="descending">Descending</option>
                        </select>
                      </div>
                    </div>
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
            </>
          )}

          {config.isMultiChart && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Multi-Chart Configuration
                </span>
              </div>
              
              {/* X-Axis for combo chart */}
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

              <div className={`p-4 rounded-lg border-2 border-dashed ${
                theme === 'dark' ? 'border-purple-600 bg-purple-900/10' : 'border-purple-300 bg-purple-50'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className={`font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                    Combination Chart Features:
                  </span>
                </div>
                <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                  <li>• Mix different chart types (bars, lines, areas, scatter)</li>
                  <li>• Assign columns to left or right Y-axis</li>
                  <li>• Customize colors, stroke width, and opacity</li>
                  <li>• Toggle visibility for each data series</li>
                  <li>• Independent normalization per column</li>
                </ul>
              </div>
            </div>
          )}

          {config.chartType === 'orderflow' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Orderflow Configuration
                </span>
              </div>

              <div className={`p-4 rounded-lg border-2 border-dashed ${
                theme === 'dark' ? 'border-green-600 bg-green-900/10' : 'border-green-300 bg-green-50'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className={`font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                    Orderflow Features:
                  </span>
                </div>
                <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                  <li>• Professional order book visualization</li>
                  <li>• Bid/Ask volume analysis at each price level</li>
                  <li>• Order flow imbalances and delta calculations</li>
                  <li>• Interactive price level tooltips</li>
                  <li>• Real-time market depth representation</li>
                  <li>• Trading-focused interface design</li>
                </ul>
              </div>
            </div>
          )}
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
          {config.chartType !== 'pie' && !config.isMultiChart && config.chartType !== 'orderflow' && (
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
                      value={xMin === undefined ? xDataMin : Math.max(xDataMin, Math.min(xDataMax, xMin))}
                      onChange={e => onUpdate({ xMin: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className={`text-xs w-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {xMin === undefined ? 'Auto' : xMin}
                    </span>
                    <input
                      type="range"
                      min={xDataMin}
                      max={xDataMax}
                      value={xMax === undefined ? xDataMax : Math.max(xDataMin, Math.min(xDataMax, xMax))}
                      onChange={e => onUpdate({ xMax: Number(e.target.value) })}
                      className="flex-1"
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
                      value={yMin === undefined ? yDataMin : Math.max(yDataMin, Math.min(yDataMax, yMin))}
                      onChange={e => onUpdate({ yMin: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className={`text-xs w-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {yMin === undefined ? 'Auto' : yMin}
                    </span>
                    <input
                      type="range"
                      min={yDataMin}
                      max={yDataMax}
                      value={yMax === undefined ? yDataMax : Math.max(yDataMin, Math.min(yDataMax, yMax))}
                      onChange={e => onUpdate({ yMax: Number(e.target.value) })}
                      className="flex-1"
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