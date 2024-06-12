import React, { useState } from 'react';
import { Database, Settings, TrendingUp, Plus, Maximize2, X, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { FileUploader } from './components/FileUploader';
import { ThemeSelector } from './components/ThemeSelector';
import { ChartControls } from './components/ChartControls';
import { ChartRenderer } from './components/ChartRenderer';
import { parseCSV, normalizeData } from './utils/csvParser';
import { DataPoint, ColumnInfo, ChartConfig, FileInfo, DataFilter } from './types';
import { ChartControlSingle } from './components/ChartControls';
import { BarChartComponent } from './components/charts/BarChartComponent';
import { LineChartComponent } from './components/charts/LineChartComponent';
import { PieChartComponent } from './components/charts/PieChartComponent';
import { ScatterChartComponent } from './components/charts/ScatterChartComponent';
import { HeatmapComponent } from './components/charts/HeatmapComponent';
import { FootprintComponent } from './components/charts/FootprintComponent';
import { DataFilterComponent } from './components/DataFilterComponent';

function AppContent() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [originalData, setOriginalData] = useState<DataPoint[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [configs, setConfigs] = useState<ChartConfig[]>([]);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [showColumnDetails, setShowColumnDetails] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState<Record<string, boolean>>({});
  const [dataFilters, setDataFilters] = useState<DataFilter[]>([]);
  const { theme } = useTheme ? useTheme() : { theme: 'light' };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      // Store file information
      setFileInfo({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type
      });

      const { data: parsedData, columns: parsedColumns } = await parseCSV(file);
      
      // Normalize data if needed
      const numericColumns = parsedColumns.filter(col => col.type === 'numeric').map(col => col.name);
      const normalizedData = normalizeData(parsedData, numericColumns);
      
      setOriginalData(normalizedData);
      setData(normalizedData);
      setColumns(parsedColumns);
      setDataFilters([]);
      
      // Auto-configure first chart
      const firstCategorical = parsedColumns.find(col => col.type === 'categorical');
      const firstNumeric = parsedColumns.find(col => col.type === 'numeric');
      
      if (firstCategorical && firstNumeric) {
        setConfigs([{
          id: 'chart-1',
          xAxis: firstCategorical.name,
          yAxis: firstNumeric.name,
          chartType: 'bar',
          normalized: false,
          title: 'Chart 1'
        }]);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to data with debouncing
  const applyFilters = React.useCallback((filters: DataFilter[]) => {
    if (filters.length === 0) {
      setData(originalData);
      return;
    }

    let filteredData = [...originalData];
    
    filters.forEach(filter => {
      filteredData = filteredData.filter(row => {
        const value = Number(row[filter.column]);
        if (isNaN(value)) return true;
        
        switch (filter.operator) {
          case 'greater':
            return value > filter.value;
          case 'less':
            return value < filter.value;
          case 'equal':
            return Math.abs(value - filter.value) < 0.001; // Handle floating point precision
          case 'greaterEqual':
            return value >= filter.value;
          case 'lessEqual':
            return value <= filter.value;
          default:
            return true;
        }
      });
    });
    
    setData(filteredData);
  }, [originalData]);

  const handleFiltersChange = (filters: DataFilter[]) => {
    setDataFilters(filters);
    applyFilters(filters);
  };

  const hasData = data.length > 0 && columns.length > 0;
  const numericColumns = columns.filter(col => col.type === 'numeric');

  // Helper to update a single config
  const updateConfig = (id: string, updates: Partial<ChartConfig>) => {
    setConfigs(configs => configs.map(config => config.id === id ? { ...config, ...updates } : config));
  };
  
  // Helper to remove a config
  const removeConfig = (id: string) => {
    if (configs.length > 1) {
      setConfigs(configs => configs.filter(config => config.id !== id));
    }
  };
  
  // Helper to add a new chart
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
    setConfigs([...configs, newConfig]);
  };

  // Toggle controls collapse
  const toggleControlsCollapse = (chartId: string) => {
    setControlsCollapsed(prev => ({
      ...prev,
      [chartId]: !prev[chartId]
    }));
  };

  // Calculate data ranges for axis controls
  const calculateDataRanges = React.useCallback((config: ChartConfig) => {
    const yKeys = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis];
    
    const xValues = data.map(d => {
      const val = d[config.xAxis];
      return typeof val === 'number' ? val : parseFloat(String(val));
    }).filter(v => !isNaN(v));

    const yValues = yKeys.flatMap(key => 
      data.map(d => {
        const val = config.normalized ? d[`${key}_normalized`] : d[key];
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

    return {
      xDataMin: xRange.min,
      xDataMax: xRange.max,
      yDataMin: yRange.min,
      yDataMax: yRange.max,
      dataLength: data.length
    };
  }, [data]);

  // Chart rendering logic with enhanced props
  const renderChart = (config: ChartConfig, isFullscreen = false) => {
    const width = isFullscreen ? '100%' : (config.width === undefined ? '100%' : (config.width === 0 ? '100%' : config.width));
    const height = isFullscreen ? 600 : (config.height === undefined ? 350 : config.height);
    
    // Calculate data ranges for this specific chart
    const dataRanges = calculateDataRanges(config);
    
    const commonProps = {
      data,
      xAxis: config.xAxis,
      yAxis: config.yAxis,
      normalized: config.normalized,
      width,
      height,
      xMin: config.xMin,
      xMax: config.xMax,
      yMin: config.yMin,
      yMax: config.yMax,
      ...dataRanges
    };
    
    switch (config.chartType) {
      case 'bar':
        return <BarChartComponent {...commonProps} />;
      case 'line':
        return <LineChartComponent {...commonProps} />;
      case 'pie':
        return <PieChartComponent {...commonProps} />;
      case 'scatter':
        return <ScatterChartComponent {...commonProps} />;
      case 'heatmap':
        return <HeatmapComponent {...commonProps} />;
      case 'footprint':
        return <FootprintComponent {...commonProps} />;
      default:
        return <BarChartComponent {...commonProps} />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  // Handle column tooltip visibility
  const handleColumnCardMouseEnter = () => {
    setShowColumnDetails(true);
  };

  const handleColumnCardMouseLeave = (e: React.MouseEvent) => {
    // Check if mouse is leaving the entire card area (including tooltip)
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipRect = document.querySelector('.column-tooltip')?.getBoundingClientRect();
    
    if (tooltipRect) {
      const combinedRect = {
        left: Math.min(rect.left, tooltipRect.left),
        right: Math.max(rect.right, tooltipRect.right),
        top: Math.min(rect.top, tooltipRect.top),
        bottom: Math.max(rect.bottom, tooltipRect.bottom)
      };
      
      if (e.clientX < combinedRect.left || e.clientX > combinedRect.right ||
          e.clientY < combinedRect.top || e.clientY > combinedRect.bottom) {
        setShowColumnDetails(false);
      }
    } else {
      setShowColumnDetails(false);
    }
  };

  // Enhanced Fullscreen modal component with zoom controls
  const FullscreenModal = ({ config }: { config: ChartConfig }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full h-full max-w-7xl max-h-full overflow-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {config.title || `Chart ${configs.findIndex(c => c.id === config.id) + 1}`}
          </h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {config.xAxis} vs {Array.isArray(config.yAxis) ? config.yAxis.join(', ') : config.yAxis}
            </div>
            <button
              onClick={() => setFullscreenChart(null)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {renderChart(config, true)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Background gradient that changes with theme */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 -z-10" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    CSV Data Visualizer
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Transform your data into beautiful insights
                  </p>
                </div>
              </div>
              <ThemeSelector />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {!hasData ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Database className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Get Started with Your Data
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a CSV file to create beautiful, interactive visualizations
                </p>
              </div>
              <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Data Overview */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Data Overview</span>
                  </h2>
                  <button
                    onClick={() => {
                      setData([]);
                      setOriginalData([]);
                      setColumns([]);
                      setConfigs([]);
                      setFileInfo(null);
                      setDataFilters([]);
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Upload New File
                  </button>
                </div>

                {/* File Information */}
                {fileInfo && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2 mb-3">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">File Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-blue-700 dark:text-blue-300">Name:</span>
                        <p className="text-blue-600 dark:text-blue-400 truncate" title={fileInfo.name}>
                          {fileInfo.name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700 dark:text-blue-300">Size:</span>
                        <p className="text-blue-600 dark:text-blue-400">{formatFileSize(fileInfo.size)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700 dark:text-blue-300">Type:</span>
                        <p className="text-blue-600 dark:text-blue-400">{fileInfo.type || 'text/csv'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700 dark:text-blue-300">Modified:</span>
                        <p className="text-blue-600 dark:text-blue-400 text-xs">
                          {formatDate(fileInfo.lastModified)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.length}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {dataFilters.length > 0 ? 'Filtered Data Points' : 'Data Points'}
                    </div>
                    {dataFilters.length > 0 && (
                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        ({originalData.length} total)
                      </div>
                    )}
                  </div>
                  <div 
                    className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-900/30 relative"
                    onMouseEnter={handleColumnCardMouseEnter}
                    onMouseLeave={handleColumnCardMouseLeave}
                  >
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{columns.length}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Columns</div>
                    
                    {/* Column Details Tooltip */}
                    {showColumnDetails && (
                      <div 
                        className="column-tooltip absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-64 max-w-80"
                        onMouseEnter={() => setShowColumnDetails(true)}
                        onMouseLeave={() => setShowColumnDetails(false)}
                      >
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Column Details:</div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {columns.map((column, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <span className="font-medium text-gray-800 dark:text-gray-200 truncate mr-2">
                                {column.name}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                column.type === 'numeric' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              }`}>
                                {column.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {columns.filter(col => col.type === 'numeric').length}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Numeric Columns</div>
                  </div>
                </div>

                {/* Enhanced Data Filters */}
                <DataFilterComponent
                  columns={numericColumns}
                  filters={dataFilters}
                  onFiltersChange={handleFiltersChange}
                  theme={theme}
                  data={originalData}
                />

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Charts</span>
                  </h2>
                  <button
                    onClick={addNewChart}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 bg-blue-600 text-white shadow-lg hover:bg-blue-700 transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Chart</span>
                  </button>
                </div>

                {/* Charts Section - Enhanced Layout */}
                <div className="space-y-8">
                  {configs.map((config, idx) => {
                    const dataRanges = calculateDataRanges(config);
                    return (
                      <div key={config.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
                        {/* Chart Controls Header with Collapse Toggle */}
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Chart Controls - {config.title || `Chart ${idx + 1}`}
                          </h3>
                          <button
                            onClick={() => toggleControlsCollapse(config.id)}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title={controlsCollapsed[config.id] ? 'Show controls' : 'Hide controls'}
                          >
                            {controlsCollapsed[config.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Chart Controls - Collapsible */}
                        {!controlsCollapsed[config.id] && (
                          <div className="mb-6">
                            <ChartControlSingle
                              config={{ ...config, ...dataRanges }}
                              columns={columns}
                              numericColumns={numericColumns}
                              onUpdate={(updates) => updateConfig(config.id, updates)}
                              onRemove={() => removeConfig(config.id)}
                              theme={theme}
                              disableRemove={configs.length === 1}
                            />
                          </div>
                        )}
                        
                        {/* Chart Display */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {config.title || `Chart ${idx + 1}`}
                            </h3>
                            <div className="flex items-center space-x-3">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {config.xAxis} vs {Array.isArray(config.yAxis) ? config.yAxis.join(', ') : config.yAxis}
                              </div>
                              <button
                                onClick={() => setFullscreenChart(config.id)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="View in fullscreen"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="w-full">
                            {renderChart(config)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Enhanced Fullscreen Modal */}
        {fullscreenChart && (
          <FullscreenModal config={configs.find(c => c.id === fullscreenChart)!} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;