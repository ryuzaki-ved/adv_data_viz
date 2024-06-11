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

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'footprint';

export type Theme = 'light' | 'dark' | 'accent';

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical';
  values: (string | number)[];
}