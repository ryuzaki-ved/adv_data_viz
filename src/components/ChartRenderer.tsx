import React from 'react';
import { ChartConfig, DataPoint, ColumnInfo } from '../types';
import { BarChartComponent } from './charts/BarChartComponent';
import { LineChartComponent } from './charts/LineChartComponent';
import { PieChartComponent } from './charts/PieChartComponent';
import { ScatterChartComponent } from './charts/ScatterChartComponent';
import { HeatmapComponent } from './charts/HeatmapComponent';
import { FootprintComponent } from './charts/FootprintComponent';
import { useTheme } from '../contexts/ThemeContext';

interface ChartRendererProps {
  data: DataPoint[];
  configs: ChartConfig[];
  columns: ColumnInfo[];
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ data, configs, columns }) => {
  const { theme } = useTheme();

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 border-gray-700';
      case 'accent':
        return 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const renderChart = (config: ChartConfig) => {
    const commonProps = {
      data,
      xAxis: config.xAxis,
      yAxis: Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis,
      normalized: config.normalized
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

  return (
    <div className="space-y-6">
      {configs.map((config) => (
        <div key={config.id} className={`p-6 rounded-xl border ${getThemeClasses()}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {config.title || `${config.chartType.charAt(0).toUpperCase() + config.chartType.slice(1)} Chart`}
            </h3>
            <div className="text-sm opacity-60">
              {config.xAxis} vs {Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis}
            </div>
          </div>
          
          <div className="w-full">
            {renderChart(config)}
          </div>
        </div>
      ))}
    </div>
  );
};