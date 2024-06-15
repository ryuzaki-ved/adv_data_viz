export interface DataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  id: string;
  xAxis: string;
  yAxis: string | string[];
  chartType: ChartType;
  normalized: boolean;
  title?: string;
  width?: number;
  height?: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xDataMin?: number;
  xDataMax?: number;
  yDataMin?: number;
  yDataMax?: number;
  dataLength?: number;
  xOrder?: string;
  yOrder?: string;
  // New multi-chart properties
  isMultiChart?: boolean;
  chartCombinations?: ChartCombination[];
}

export interface ChartCombination {
  id: string;
  column: string;
  chartType: ChartType;
  yAxisId: 'left' | 'right';
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  visible?: boolean;
  normalized?: boolean;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: number;
  type: string;
}

export interface DataFilter {
  id: string;
  column: string;
  operator: 'greater' | 'less' | 'equal' | 'greaterEqual' | 'lessEqual';
  value: number;
}

export interface OrderflowDataPoint {
  price: number;
  bidVolume: number;
  askVolume: number;
  delta?: number; // askVolume - bidVolume
  time?: string; // optional, for time-based orderflow
}

export interface OrderbookLevel {
  price: number;
  size: number;
  side: 'bid' | 'ask';
}

export interface OrderbookSnapshot {
  time: number; // ms or ISO string
  levels: OrderbookLevel[]; // sorted by price
}

export interface TradePrint {
  time: number;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'footprint' | 'orderflow' | 'area' | 'step';

export type Theme = 'light' | 'dark' | 'accent';

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical';
  values: (string | number)[];
}