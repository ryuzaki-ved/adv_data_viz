import React, { useState } from 'react';
import { Database, Settings, TrendingUp } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { FileUploader } from './components/FileUploader';
import { ThemeSelector } from './components/ThemeSelector';
import { ChartControls } from './components/ChartControls';
import { ChartRenderer } from './components/ChartRenderer';
import { parseCSV, normalizeData } from './utils/csvParser';
import { DataPoint, ColumnInfo, ChartConfig } from './types';

function AppContent() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChartConfig>({
    xAxis: '',
    yAxis: '',
    chartType: 'bar',
    normalized: false
  });

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const { data: parsedData, columns: parsedColumns } = await parseCSV(file);
      
      // Normalize data if needed
      const numericColumns = parsedColumns.filter(col => col.type === 'numeric').map(col => col.name);
      const normalizedData = normalizeData(parsedData, numericColumns);
      
      setData(normalizedData);
      setColumns(parsedColumns);
      
      // Auto-configure axes
      const firstCategorical = parsedColumns.find(col => col.type === 'categorical');
      const firstNumeric = parsedColumns.find(col => col.type === 'numeric');
      
      if (firstCategorical && firstNumeric) {
        setConfig({
          xAxis: firstCategorical.name,
          yAxis: firstNumeric.name,
          chartType: 'bar',
          normalized: false
        });
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = data.length > 0 && columns.length > 0;

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
                      setColumns([]);
                      setConfig({ xAxis: '', yAxis: '', chartType: 'bar', normalized: false });
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Upload New File
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.length}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Data Points</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{columns.length}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Columns</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {columns.filter(col => col.type === 'numeric').length}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Numeric Columns</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ChartControls
                    columns={columns}
                    config={config}
                    onConfigChange={setConfig}
                  />
                  
                  {config.xAxis && config.yAxis && (
                    <ChartRenderer
                      data={data}
                      config={config}
                      columns={columns}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
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