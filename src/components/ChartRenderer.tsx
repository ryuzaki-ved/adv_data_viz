import React from 'react';
import { ChartConfig, DataPoint, ColumnInfo } from '../types';
import { BarChartComponent } from './charts/BarChartComponent';
import { LineChartComponent } from './charts/LineChartComponent';
import { PieChartComponent } from './charts/PieChartComponent';
import { ScatterChartComponent } from './charts/ScatterChartComponent';
import { HeatmapComponent } from './charts/HeatmapComponent';
import { FootprintComponent } from './charts/FootprintComponent';
import { OrderflowChartComponent } from './charts/OrderflowChartComponent';
import { OrderflowHeatmapChartComponent } from './charts/OrderflowHeatmapChartComponent';
import { useTheme } from '../contexts/ThemeContext';

interface ChartRendererProps {
  data: DataPoint[];
  configs: ChartConfig[];
  columns: ColumnInfo[];
  globalAxisOrder?: boolean;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ data, configs, columns, globalAxisOrder }) => {
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

  // Sorting utility (same as in AppContent)
  function sortData(data: DataPoint[], xAxis: string, xOrder: string, yAxis: string, yOrder: string) {
    let sorted = [...data];
    if (xOrder && xOrder !== 'file') {
      sorted.sort((a, b) => {
        const aVal = a[xAxis];
        const bVal = b[xAxis];
        if (aVal === undefined || bVal === undefined) return 0;
        if (xOrder === 'ascending') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        if (xOrder === 'descending') return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        return 0;
      });
    }
    if (yOrder && yOrder !== 'file') {
      sorted.sort((a, b) => {
        const aVal = a[yAxis];
        const bVal = b[yAxis];
        if (aVal === undefined || bVal === undefined) return 0;
        if (yOrder === 'ascending') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        if (yOrder === 'descending') return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        return 0;
      });
    }
    return sorted;
  }

  const renderChart = (config: ChartConfig) => {
    let chartData = data;
    if (!globalAxisOrder) {
      const xOrder = config.xOrder || 'file';
      const yOrder = config.yOrder || 'file';
      chartData = sortData(data, config.xAxis, xOrder, Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis, yOrder);
    }
    const commonProps = {
      data: chartData,
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
      case 'orderflow':
        return <OrderflowChartComponent data={data} width={config.width || '100%'} height={config.height || 600} theme={theme} />;
      case 'orderflow-heatmap':
        return <OrderflowHeatmapChartComponent orderbook={window.__MOCK_ORDERBOOK__ || []} trades={window.__MOCK_TRADES__ || []} width={config.width || 800} height={config.height || 500} theme={theme} />;
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