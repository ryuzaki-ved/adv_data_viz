import React from 'react';
import { BarChart3, LineChart, PieChart, ScatterChart as Scatter, Grid3x3, Target } from 'lucide-react';
import { ChartConfig, ChartType, ColumnInfo } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ChartControlsProps {
  columns: ColumnInfo[];
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({ columns, config, onConfigChange }) => {
  const { theme } = useTheme();

  const chartTypes: { key: ChartType; icon: React.ReactNode; label: string }[] = [
    { key: 'bar', icon: <BarChart3 className="h-4 w-4" />, label: 'Bar Chart' },
    { key: 'line', icon: <LineChart className="h-4 w-4" />, label: 'Line Chart' },
    { key: 'pie', icon: <PieChart className="h-4 w-4" />, label: 'Pie Chart' },
    { key: 'scatter', icon: <Scatter className="h-4 w-4" />, label: 'Scatter Plot' },
    { key: 'heatmap', icon: <Grid3x3 className="h-4 w-4" />, label: 'Heatmap' },
    { key: 'footprint', icon: <Target className="h-4 w-4" />, label: 'Footprint' }
  ];

  const numericColumns = columns.filter(col => col.type === 'numeric');
  const categoricalColumns = columns.filter(col => col.type === 'categorical');

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          card: 'bg-gray-800 border-gray-700',
          input: 'bg-gray-700 border-gray-600 text-white',
          button: 'bg-gray-700 text-white hover:bg-gray-600',
          activeButton: 'bg-blue-600 text-white shadow-lg'
        };
      case 'accent':
        return {
          card: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200',
          input: 'bg-white border-purple-200 text-purple-900',
          button: 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200',
          activeButton: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
        };
      default:
        return {
          card: 'bg-white border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900',
          button: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          activeButton: 'bg-blue-600 text-white shadow-lg'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`p-6 rounded-xl border ${themeClasses.card} space-y-6`}>
      <h3 className="text-lg font-semibold">Chart Configuration</h3>
      
      {/* Chart Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Chart Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {chartTypes.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => onConfigChange({ ...config, chartType: key })}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">X-Axis</label>
          <select
            value={config.xAxis}
            onChange={(e) => onConfigChange({ ...config, xAxis: e.target.value })}
            className={`w-full p-3 rounded-lg border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            {columns.map(column => (
              <option key={column.name} value={column.name}>
                {column.name} ({column.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Y-Axis</label>
          <select
            value={Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis}
            onChange={(e) => onConfigChange({ ...config, yAxis: e.target.value })}
            className={`w-full p-3 rounded-lg border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            {numericColumns.map(column => (
              <option key={column.name} value={column.name}>
                {column.name} ({column.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Normalization Toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="normalize"
          checked={config.normalized}
          onChange={(e) => onConfigChange({ ...config, normalized: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="normalize" className="text-sm font-medium cursor-pointer">
          Normalize data (0-1 scale)
        </label>
      </div>
    </div>
  );
};